// src/features/vocabulary/mocks/vocabulary.mock.ts

interface DictEntry {
  meaningVi: string;
  phonetic?: string;
  partOfSpeech?: string;
  example?: string;
}

export const mockDictionary: Record<string, DictEntry> = {
  environment: {
    meaningVi: "môi trường",
    phonetic: "/ɪnˈvaɪrənmənt/",
    partOfSpeech: "noun",
    example: "We need to protect the environment from pollution.",
  },
  improve: {
    meaningVi: "cải thiện, tiến bộ",
    phonetic: "/ɪmˈpruːv/",
    partOfSpeech: "verb",
    example: "She worked hard to improve her pronunciation.",
  },
  however: {
    meaningVi: "tuy nhiên, tuy vậy",
    phonetic: "/haʊˈevər/",
    partOfSpeech: "adverb",
    example: "The test was difficult; however, she passed.",
  },
  although: {
    meaningVi: "mặc dù, dù rằng",
    phonetic: "/ɔːlˈðoʊ/",
    partOfSpeech: "conjunction",
    example: "Although it was raining, they went for a walk.",
  },
  significant: {
    meaningVi: "đáng kể, quan trọng",
    phonetic: "/sɪɡˈnɪfɪkənt/",
    partOfSpeech: "adjective",
    example: "There has been a significant improvement in his reading skills.",
  },
  opportunity: {
    meaningVi: "cơ hội",
    phonetic: "/ˌɒpəˈtjuːnɪti/",
    partOfSpeech: "noun",
    example: "This is a great opportunity to practise your speaking.",
  },
  challenge: {
    meaningVi: "thử thách",
    phonetic: "/ˈtʃælɪndʒ/",
    partOfSpeech: "noun",
    example: "Learning a new language is always a challenge.",
  },
  fluent: {
    meaningVi: "thành thạo, lưu loát",
    phonetic: "/ˈfluːənt/",
    partOfSpeech: "adjective",
    example: "She is fluent in both English and French.",
  },
  pronunciation: {
    meaningVi: "cách phát âm",
    phonetic: "/prəˌnʌnsiˈeɪʃn/",
    partOfSpeech: "noun",
    example: "Good pronunciation is important for clear communication.",
  },
  vocabulary: {
    meaningVi: "từ vựng",
    phonetic: "/vəˈkæbjələri/",
    partOfSpeech: "noun",
    example: "Building vocabulary is key to VSTEP success.",
  },
  grammar: {
    meaningVi: "ngữ pháp",
    phonetic: "/ˈɡræmər/",
    partOfSpeech: "noun",
    example: "She studied grammar to improve her writing score.",
  },
  listening: {
    meaningVi: "kỹ năng nghe",
    phonetic: "/ˈlɪsənɪŋ/",
    partOfSpeech: "noun",
    example: "Listening practice helps you understand native speakers.",
  },
  reading: {
    meaningVi: "kỹ năng đọc",
    phonetic: "/ˈriːdɪŋ/",
    partOfSpeech: "noun",
    example: "Daily reading improves both vocabulary and comprehension.",
  },
  writing: {
    meaningVi: "kỹ năng viết",
    phonetic: "/ˈraɪtɪŋ/",
    partOfSpeech: "noun",
    example: "Academic writing requires clear structure and coherent ideas.",
  },
  speaking: {
    meaningVi: "kỹ năng nói",
    phonetic: "/ˈspiːkɪŋ/",
    partOfSpeech: "noun",
    example: "Speaking practise helps build confidence and fluency.",
  },
};

const DEFAULT_MEANING = "Chưa có nghĩa. Bạn có thể cập nhật sau.";

export function lookupWord(word: string): Pick<
  import("../types").SavedVocabulary,
  "meaningVi" | "phonetic" | "partOfSpeech" | "example"
> {
  const key = word.trim().toLowerCase();
  const entry = mockDictionary[key];
  if (entry) return entry;
  return { meaningVi: DEFAULT_MEANING };
}
