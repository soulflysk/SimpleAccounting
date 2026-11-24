using System.ComponentModel.DataAnnotations;

namespace Account.Dtos
{
    public record TransactionDto(
        int Id,
        string TransactionDate,   // yyyy-MM-dd
        string Type,              // "Income" | "Expense"
        string Description,
        decimal UnitPrice,
        decimal TotalAmount,
        bool IsDisabled);

    public record SummaryDto(
        decimal TotalIncome,
        decimal TotalExpense,
        decimal Balance);

    public record PagedTransactionsDto(
        IReadOnlyList<TransactionDto> Items,
        int PageNumber,
        int PageSize,
        int TotalItems,
        int TotalPages,
        SummaryDto Summary);

    public class SaveTransactionRequest
    {
        [Required]
        public DateTime TransactionDate { get; set; }

        [Required]
        public string Type { get; set; } = "Income";

        [Required]
        [StringLength(200)]
        public string Description { get; set; } = string.Empty;

        [Range(0, double.MaxValue, ErrorMessage = "ราคาต่อหน่วยต้องไม่ติดลบ")]
        public decimal UnitPrice { get; set; }
    }

    // ใช้กับ PUT /api/transactions/{id} และ POST toggle (คืน summary ใหม่ทุกครั้ง)
    public record TransactionResultDto(
        TransactionDto Transaction,
        SummaryDto Summary);

    public record ImportResultDto(int Imported, SummaryDto Summary);

    public record ErrorDto(string Message);
    public class SetDisabledRequest
    {
        [Required]
        public List<int> Ids { get; set; } = new();

        public bool IsDisabled { get; set; }
    }

    public record BulkDisabledResultDto(
        IReadOnlyList<int> Ids,
        bool IsDisabled,
        SummaryDto Summary);
}
