export interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

export interface Part {
  title: string;
  type: string;
  readTime: string;
  description: string;
  questions: Question[];
}

export const listeningParts: Part[] = [
  {
    title: "Part 1 – Short Announcements / Instructions",
    type: "Thông báo ngắn",
    readTime: "30 giây",
    description: "Nghe 8 thông báo hoặc hướng dẫn ngắn. Đáp án (A, B, C, D) thường ngắn gọn.",
    questions: [
      { id: 1, question: "What is the main purpose of the announcement?", options: ["To announce a holiday", "To inform about a schedule change", "To introduce a new teacher", "To cancel a class"], correct: 1 },
      { id: 2, question: "What should passengers do before boarding?", options: ["Show their ticket", "Check their luggage", "Turn off electronic devices", "Fasten seat belts"], correct: 0 },
      { id: 3, question: "Where would this announcement most likely be heard?", options: ["In a hospital", "At an airport", "In a school", "At a supermarket"], correct: 1 },
      { id: 4, question: "What time does the event start?", options: ["8:00 AM", "9:30 AM", "10:00 AM", "2:00 PM"], correct: 2 },
      { id: 5, question: "What is being advertised?", options: ["A new restaurant", "A training course", "A travel package", "A health product"], correct: 1 },
      { id: 6, question: "Who is the intended audience?", options: ["Students", "Employees", "Tourists", "Patients"], correct: 1 },
      { id: 7, question: "What does the speaker suggest?", options: ["Arriving early", "Bringing an ID", "Wearing formal clothes", "Preparing a speech"], correct: 0 },
      { id: 8, question: "What will happen next week?", options: ["A test", "A meeting", "A celebration", "A renovation"], correct: 1 },
    ],
  },
  {
    title: "Part 2 – Conversations",
    type: "Hội thoại",
    readTime: "20 giây trước mỗi đoạn",
    description: "Nghe 3 đoạn hội thoại giữa 2 người. Mỗi đoạn có 4 câu hỏi.",
    questions: [
      { id: 9, question: "What are the speakers mainly discussing?", options: ["A project deadline", "A job interview", "A vacation plan", "A birthday party"], correct: 0 },
      { id: 10, question: "What does the woman suggest?", options: ["Hiring more staff", "Extending the deadline", "Working overtime", "Cancelling the project"], correct: 2 },
      { id: 11, question: "Why is the man concerned?", options: ["He lost his report", "The budget is limited", "The client is unhappy", "He missed a meeting"], correct: 1 },
      { id: 12, question: "What will they probably do next?", options: ["Call the manager", "Send an email", "Schedule a meeting", "Review the documents"], correct: 2 },
      { id: 13, question: "Where does this conversation take place?", options: ["In an office", "At a restaurant", "In a library", "At a hospital"], correct: 0 },
      { id: 14, question: "What does the woman want to know?", options: ["The price", "The schedule", "The location", "The requirements"], correct: 3 },
      { id: 15, question: "How does the man feel about the proposal?", options: ["Excited", "Uncertain", "Disappointed", "Angry"], correct: 1 },
      { id: 16, question: "What problem do they need to solve?", options: ["A shipping delay", "A software bug", "A miscommunication", "A budget cut"], correct: 2 },
      { id: 17, question: "What did the woman do last week?", options: ["Attended a conference", "Visited a client", "Took an exam", "Started a new job"], correct: 0 },
      { id: 18, question: "What does the man offer to do?", options: ["Drive her home", "Help with the report", "Lend his notes", "Cook dinner"], correct: 1 },
      { id: 19, question: "When will they meet again?", options: ["Tomorrow morning", "Next Monday", "This Friday", "In two weeks"], correct: 2 },
      { id: 20, question: "What is the woman's main concern?", options: ["Quality of work", "Time management", "Cost reduction", "Team coordination"], correct: 3 },
    ],
  },
  {
    title: "Part 3 – Talks / Lectures",
    type: "Bài nói / Bài giảng",
    readTime: "30 giây trước mỗi bài",
    description: "Nghe 3 bài nói hoặc bài giảng mang tính học thuật. Mỗi bài có 5 câu hỏi.",
    questions: [
      { id: 21, question: "What is the main topic of the lecture?", options: ["Climate change effects", "Economic growth patterns", "Modern architecture", "Digital marketing"], correct: 0 },
      { id: 22, question: "According to the speaker, what is the primary cause?", options: ["Industrial pollution", "Deforestation", "Urbanization", "All of the above"], correct: 3 },
      { id: 23, question: "What evidence does the speaker provide?", options: ["Statistical data", "Personal experience", "Historical records", "Expert interviews"], correct: 0 },
      { id: 24, question: "What solution does the speaker propose?", options: ["Government regulation", "Public awareness campaigns", "Technological innovation", "International cooperation"], correct: 2 },
      { id: 25, question: "What is the speaker's conclusion?", options: ["The situation is hopeless", "Immediate action is needed", "More research is required", "The problem is exaggerated"], correct: 1 },
      { id: 26, question: "What field of study is this lecture about?", options: ["Biology", "Psychology", "Sociology", "Linguistics"], correct: 1 },
      { id: 27, question: "What experiment is described?", options: ["Memory recall test", "Visual perception study", "Behavioral observation", "Language acquisition analysis"], correct: 0 },
      { id: 28, question: "What were the findings of the study?", options: ["No significant difference", "Strong positive correlation", "Unexpected negative results", "Inconclusive data"], correct: 1 },
      { id: 29, question: "Who conducted the original research?", options: ["Dr. Smith", "Prof. Johnson", "Dr. Williams", "Prof. Brown"], correct: 2 },
      { id: 30, question: "What limitation does the speaker mention?", options: ["Small sample size", "Short time frame", "Cultural bias", "Equipment failure"], correct: 0 },
      { id: 31, question: "What historical period is being discussed?", options: ["The Renaissance", "The Industrial Revolution", "The Digital Age", "The Cold War"], correct: 1 },
      { id: 32, question: "How did the event impact society?", options: ["It increased inequality", "It improved living standards", "It slowed technological progress", "It had minimal effect"], correct: 1 },
      { id: 33, question: "What comparison does the speaker make?", options: ["Past vs present", "East vs West", "Theory vs practice", "Rural vs urban"], correct: 0 },
      { id: 34, question: "What does the speaker emphasize at the end?", options: ["The need for further study", "The importance of education", "The role of technology", "The value of tradition"], correct: 2 },
      { id: 35, question: "What is the speaker's tone throughout?", options: ["Formal and objective", "Casual and humorous", "Passionate and persuasive", "Critical and skeptical"], correct: 0 },
    ],
  },
];

// Audio duration per part (seconds)
export const PART_DURATIONS = [360, 330, 450];
export const TOTAL_TIME = PART_DURATIONS.reduce((a, b) => a + b, 0); // ~19 min total audio + buffer
