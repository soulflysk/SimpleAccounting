using Account.Data;
using Account.Dtos;
using Account.Models;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Account.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private const int PageSize = 50;
        private readonly ApplicationDbContext _context;

        public TransactionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET /api/transactions?pageNumber=1
        [HttpGet]
        public async Task<ActionResult<PagedTransactionsDto>> GetPage(int pageNumber = 1)
        {
            var totalItems = await _context.Transactions.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)PageSize);

            if (pageNumber < 1) pageNumber = 1;
            if (totalPages > 0 && pageNumber > totalPages) pageNumber = totalPages;

            var items = await _context.Transactions
                .AsNoTracking()
                .OrderByDescending(x => x.TransactionDate)
                .ThenByDescending(x => x.Id)
                .Skip((pageNumber - 1) * PageSize)
                .Take(PageSize)
                .ToListAsync();

            var summary = await GetSummaryAsync();

            return new PagedTransactionsDto(
                items.Select(ToDto).ToList(),
                pageNumber,
                PageSize,
                totalItems,
                totalPages,
                summary);
        }

        // GET /api/transactions/summary
        [HttpGet("summary")]
        public async Task<ActionResult<SummaryDto>> Summary()
            => await GetSummaryAsync();

        // POST /api/transactions
        [HttpPost]
        public async Task<ActionResult<TransactionResultDto>> Create(SaveTransactionRequest request)
        {
            var error = Validate(request);
            if (error != null) return BadRequest(new ErrorDto(error));

            var model = new Transaction
            {
                TransactionDate = request.TransactionDate,
                Type = request.Type,
                Description = request.Description.Trim(),
                UnitPrice = request.UnitPrice,
                CreatedAt = DateTime.Now
            };

            Calculate(model);

            _context.Transactions.Add(model);
            await _context.SaveChangesAsync();

            return new TransactionResultDto(ToDto(model), await GetSummaryAsync());
        }

        // PUT /api/transactions/{id}
        [HttpPut("{id:int}")]
        public async Task<ActionResult<TransactionResultDto>> Update(int id, SaveTransactionRequest request)
        {
            var error = Validate(request);
            if (error != null) return BadRequest(new ErrorDto(error));

            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null)
                return NotFound(new ErrorDto("ไม่พบรายการ"));

            // แก้เฉพาะ 4 ค่า Category / Quantity / Discount เดิมไม่ถูกทับ
            transaction.TransactionDate = request.TransactionDate;
            transaction.Type = request.Type;
            transaction.Description = request.Description.Trim();
            transaction.UnitPrice = request.UnitPrice;

            Calculate(transaction);

            await _context.SaveChangesAsync();

            return new TransactionResultDto(ToDto(transaction), await GetSummaryAsync());
        }

        // DELETE /api/transactions/{id}
        [HttpDelete("{id:int}")]
        public async Task<ActionResult<SummaryDto>> Delete(int id)
        {
            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null)
                return NotFound(new ErrorDto("ไม่พบรายการ"));

            _context.Transactions.Remove(transaction);
            await _context.SaveChangesAsync();

            return await GetSummaryAsync();
        }

        // POST /api/transactions/{id}/toggle-disabled
        [HttpPost("{id:int}/toggle-disabled")]
        public async Task<ActionResult<TransactionResultDto>> ToggleDisabled(int id)
        {
            var transaction = await _context.Transactions.FindAsync(id);
            if (transaction == null)
                return NotFound(new ErrorDto("ไม่พบรายการ"));

            transaction.IsDisabled = !transaction.IsDisabled;
            await _context.SaveChangesAsync();

            return new TransactionResultDto(ToDto(transaction), await GetSummaryAsync());
        }

        // POST /api/transactions/import  (multipart/form-data, field: file)
        [HttpPost("import")]
        public async Task<ActionResult<ImportResultDto>> ImportExcel(IFormFile? file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new ErrorDto("กรุณาเลือกไฟล์ Excel"));

            var extension = Path.GetExtension(file.FileName);
            if (!string.Equals(extension, ".xlsx", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new ErrorDto("รองรับเฉพาะไฟล์ .xlsx"));

            try
            {
                using var stream = file.OpenReadStream();
                using var workbook = new XLWorkbook(stream);

                var worksheet = workbook.Worksheets.FirstOrDefault();
                if (worksheet == null)
                    return BadRequest(new ErrorDto("ไม่พบ Worksheet ในไฟล์ Excel"));

                var rows = worksheet.RangeUsed()?.RowsUsed().Skip(1);
                if (rows == null)
                    return BadRequest(new ErrorDto("ไม่พบข้อมูลใน Excel"));

                var transactions = new List<Transaction>();

                foreach (var row in rows)
                {
                    // ข้ามแถวว่าง
                    if (row.Cells().All(x => x.IsEmpty()))
                        continue;

                    var transaction = new Transaction();

                    // วันที่
                    if (row.Cell(1).TryGetValue<DateTime>(out var date))
                        transaction.TransactionDate = date;
                    else
                        continue;

                    // ประเภท
                    var type = row.Cell(2).GetString().Trim();
                    transaction.Type = type switch
                    {
                        "รายรับ" => "Income",
                        "รายจ่าย" => "Expense",
                        "Income" => "Income",
                        "Expense" => "Expense",
                        _ => ""
                    };

                    if (string.IsNullOrEmpty(transaction.Type))
                        return BadRequest(new ErrorDto($"ประเภทไม่ถูกต้องในแถว {row.RowNumber()}"));

                    // รายการ
                    transaction.Description = row.Cell(3).GetString().Trim();

                    // ราคาต่อหน่วย
                    transaction.UnitPrice = row.Cell(4).GetValue<decimal>();

                    Calculate(transaction);
                    transaction.CreatedAt = DateTime.Now;

                    transactions.Add(transaction);
                }

                if (transactions.Count == 0)
                    return BadRequest(new ErrorDto("ไม่พบข้อมูลที่สามารถ Import ได้"));

                await _context.Transactions.AddRangeAsync(transactions);
                await _context.SaveChangesAsync();

                return new ImportResultDto(transactions.Count, await GetSummaryAsync());
            }
            catch (Exception ex)
            {
                return BadRequest(new ErrorDto($"Import ไม่สำเร็จ: {ex.Message}"));
            }
        }

        // ------------------------------------------------------------------
        // Helpers
        // ------------------------------------------------------------------

        private static string? Validate(SaveTransactionRequest request)
        {
            if (request.Type != "Income" && request.Type != "Expense")
                return "ประเภทไม่ถูกต้อง";

            if (string.IsNullOrWhiteSpace(request.Description))
                return "กรุณากรอกรายการ";

            if (request.UnitPrice < 0)
                return "ราคาต่อหน่วยต้องไม่ติดลบ";

            return null;
        }

        private async Task<SummaryDto> GetSummaryAsync()
        {
            var totalIncome = await _context.Transactions
                .Where(x => !x.IsDisabled && x.Type == "Income")
                .SumAsync(x => x.TotalAmount);

            var totalExpense = await _context.Transactions
                .Where(x => !x.IsDisabled && x.Type == "Expense")
                .SumAsync(x => x.TotalAmount);

            return new SummaryDto(totalIncome, totalExpense, totalIncome - totalExpense);
        }

        private static TransactionDto ToDto(Transaction t) => new(
            t.Id,
            t.TransactionDate.ToString("yyyy-MM-dd"),
            t.Type,
            t.Description,
            t.UnitPrice,
            t.TotalAmount,
            t.IsDisabled);

        private static void Calculate(Transaction model)
        {
            var amount = (model.Quantity * model.UnitPrice) - model.Discount;
            if (amount < 0) amount = 0;
            model.TotalAmount = Math.Round(amount, 2);
        }
    }
}
