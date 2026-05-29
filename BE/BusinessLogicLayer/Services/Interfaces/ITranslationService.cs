namespace BusinessLogicLayer.Services.Interfaces;

public interface ITranslationService
{
    Task<string> TranslateEnToViAsync(string text);
}
