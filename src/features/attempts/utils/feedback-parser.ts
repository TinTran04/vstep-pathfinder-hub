/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/attempts/utils/feedback-parser.ts

import type { WritingFeedbackResult, SpeakingFeedbackResult, TimestampFeedback } from "../types";

export function parseFeedbackJson(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === "object") return value as Record<string, any>;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

export function normalizeWritingFeedback(value: unknown, fallbackScore?: number | null): WritingFeedbackResult | null {
  const parsed = parseFeedbackJson(value);
  if (!parsed && typeof fallbackScore !== "number") return null;
  
  const obj = parsed || {};

  const score = obj.score ?? obj.overallScore ?? obj.overall ?? fallbackScore ?? 0;
  
  const criteria = obj.criteria || {};
  
  // Resolve taskFulfillment from new field or legacy aliases
  const taskFulfillment = obj.taskFulfillment ?? criteria.taskFulfillment
    ?? obj.task_response ?? obj.taskResponse ?? obj.taskAchievement
    ?? criteria.taskAchievement ?? criteria.task_response ?? criteria.taskResponse;

  return {
    score,
    overallScore: score,
    // New primary field
    taskFulfillment,
    grammar: criteria.grammar ?? obj.grammar,
    vocabulary: criteria.vocabulary ?? obj.vocabulary ?? criteria.lexical ?? obj.lexical,
    organization: criteria.organization ?? obj.organization,
    // Legacy aliases (for components that still reference these)
    taskResponse: taskFulfillment,
    taskAchievement: taskFulfillment,
    coherence: criteria.organization ?? obj.organization ?? criteria.coherence ?? obj.coherence,
    lexical: criteria.vocabulary ?? obj.vocabulary ?? criteria.lexical ?? obj.lexical,
    
    feedbackPoints: Array.isArray(obj.feedbackPoints) ? obj.feedbackPoints : 
                    Array.isArray(obj.feedback) ? obj.feedback :
                    Array.isArray(obj.tips) ? obj.tips : [],
    tips: Array.isArray(obj.tips) ? obj.tips : 
          Array.isArray(obj.nextPracticeSuggestions) ? obj.nextPracticeSuggestions : [],
    
    errors: Array.isArray(obj.errors) ? obj.errors : 
            Array.isArray(obj.mistakes) ? obj.mistakes.map((m: any) => ({
              word: m.word || m.error || "",
              type: m.type || "grammar",
              suggestion: m.suggestion || m.correction,
              explanation: m.explanation || m.reason
            })) : [],
            
    summary: obj.summary,
    strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
    weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses : [],
    scoreExplanation: obj.review?.scoreExplanation ?? obj.scoreExplanation,
    mainReasonsForLostPoints: Array.isArray(obj.review?.mainReasonsForLostPoints) ? obj.review.mainReasonsForLostPoints : [],
    howToImprove: Array.isArray(obj.review?.howToImprove) ? obj.review.howToImprove : [],
    improvedVersion: obj.improvedVersion ?? obj.betterAnswer,
    weaknessTags: Array.isArray(obj.weaknessTags) ? obj.weaknessTags : [],
    nextPracticeSuggestions: Array.isArray(obj.nextPracticeSuggestions) ? obj.nextPracticeSuggestions : [],
    criteriaExplanations: obj.criteriaExplanations || {}
  } as any;
}

export function normalizeSpeakingFeedback(value: unknown, fallbackScore?: number | null): SpeakingFeedbackResult | null {
  const parsed = parseFeedbackJson(value);
  if (!parsed && typeof fallbackScore !== "number") return null;

  const obj = parsed || {};

  const score = obj.score ?? obj.overallScore ?? obj.overall ?? fallbackScore ?? 0;
  
  const criteria = obj.criteria || {};
  
  // Resolve new fields from new name or legacy aliases
  const fluencyIdeaDevelopment = obj.fluencyIdeaDevelopment ?? criteria.fluencyIdeaDevelopment
    ?? obj.fluency ?? criteria.fluency;
  const contentCoherence = obj.contentCoherence ?? criteria.contentCoherence
    ?? obj.topicDevelopment ?? obj.relevance
    ?? criteria.topicDevelopment ?? criteria.relevance;

  const timestampFeedbackRaw = Array.isArray(obj.timestampFeedback) ? obj.timestampFeedback : 
                               Array.isArray(obj.timestamps) ? obj.timestamps : [];
                               
  const timestampFeedback: TimestampFeedback[] = timestampFeedbackRaw.map((t: any) => ({
    timestamp: t.timestamp || t.startTime,
    startTime: t.startTime || t.timestamp,
    endTime: t.endTime,
    type: t.type || "general",
    issue: t.issue || t.feedback,
    suggestion: t.suggestion,
    feedback: t.feedback || t.issue
  }));

  return {
    score,
    overallScore: score,
    // New primary fields
    fluencyIdeaDevelopment,
    pronunciation: criteria.pronunciation ?? obj.pronunciation,
    vocabulary: criteria.vocabulary ?? obj.vocabulary,
    grammar: criteria.grammar ?? obj.grammar,
    contentCoherence,
    // Legacy aliases
    fluency: fluencyIdeaDevelopment,
    topicDevelopment: contentCoherence,
    relevance: contentCoherence,
    
    feedbackPoints: Array.isArray(obj.feedbackPoints) ? obj.feedbackPoints : 
                    Array.isArray(obj.feedback) ? obj.feedback :
                    Array.isArray(obj.tips) ? obj.tips : [],
    tips: Array.isArray(obj.tips) ? obj.tips : 
          Array.isArray(obj.nextPracticeSuggestions) ? obj.nextPracticeSuggestions : [],
    transcript: obj.transcript,
    timestampFeedback,
    
    summary: obj.summary,
    strengths: Array.isArray(obj.strengths) ? obj.strengths : [],
    weaknesses: Array.isArray(obj.weaknesses) ? obj.weaknesses : [],
    scoreExplanation: obj.review?.scoreExplanation ?? obj.scoreExplanation,
    betterAnswer: obj.betterAnswer ?? obj.improvedVersion,
    weaknessTags: Array.isArray(obj.weaknessTags) ? obj.weaknessTags : [],
    nextPracticeSuggestions: Array.isArray(obj.nextPracticeSuggestions) ? obj.nextPracticeSuggestions : [],
    criteriaExplanations: obj.criteriaExplanations || {}
  } as any;
}
