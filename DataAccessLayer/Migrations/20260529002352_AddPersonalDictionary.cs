using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DataAccessLayer.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonalDictionary : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DictionaryEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Word = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Phonetic = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    AudioUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PartOfSpeech = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    EnglishDefinition = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    VietnameseMeaning = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Example = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ExampleVietnamese = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DictionaryEntries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserVocabulary",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    DictionaryEntryId = table.Column<int>(type: "integer", nullable: false),
                    PersonalNote = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    ReviewCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    LastReviewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    NextReviewAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserVocabulary", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserVocabulary_DictionaryEntries_DictionaryEntryId",
                        column: x => x.DictionaryEntryId,
                        principalTable: "DictionaryEntries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserVocabulary_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DictionaryEntries_Word",
                table: "DictionaryEntries",
                column: "Word",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserVocabulary_DictionaryEntryId",
                table: "UserVocabulary",
                column: "DictionaryEntryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserVocabulary_UserId_DictionaryEntryId",
                table: "UserVocabulary",
                columns: new[] { "UserId", "DictionaryEntryId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserVocabulary_UserId_IsFavorite_CreatedAt",
                table: "UserVocabulary",
                columns: new[] { "UserId", "IsFavorite", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserVocabulary");

            migrationBuilder.DropTable(
                name: "DictionaryEntries");
        }
    }
}
