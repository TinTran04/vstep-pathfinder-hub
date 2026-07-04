import { useEffect, useRef, useCallback } from 'react';
import { attemptsService } from '../services/attempts.service';

export function useAutosave(attemptId: string | null | undefined, currentSkill: string, dataGetter: () => any) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataGetterRef = useRef(dataGetter);
  const saveInProgressRef = useRef(false);

  dataGetterRef.current = dataGetter;

  const performSave = useCallback(async () => {
    if (!attemptId || saveInProgressRef.current) return;
    const data = dataGetterRef.current();
    if (!data) return;

    saveInProgressRef.current = true;
    try {
      await attemptsService.autosaveMockTest(attemptId, currentSkill, JSON.stringify(data));
    } catch (err) {
      console.error('Autosave failed', err);
    } finally {
      saveInProgressRef.current = false;
    }
  }, [attemptId, currentSkill]);

  useEffect(() => {
    // Save on blur
    const handleBlur = () => {
      performSave();
    };
    
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [performSave]);

  useEffect(() => {
    if (!attemptId) return;

    // Save every 15s
    timeoutRef.current = setInterval(() => {
      performSave();
    }, 15000);

    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
      performSave(); // Save on unmount / skill change
    };
  }, [attemptId, performSave]);

  return { triggerSave: performSave };
}
