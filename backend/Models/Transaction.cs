using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Account.Models
{
    // Entity เดิม ไม่เปลี่ยน schema ฐานข้อมูล
    public class Transaction
    {
        public int Id { get; set; }

        [Required]
        public DateTime TransactionDate { get; set; } = DateTime.Today;

        [Required]
        public string Type { get; set; } = "Income";

        [Required]
        [StringLength(200)]
        public string Description { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Category { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Discount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        public bool IsDisabled { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
