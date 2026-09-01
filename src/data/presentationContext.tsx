import { createContext, useContext, useState, useCallback, useEffect } from 'react';

type PresentationTool = 'laser' | 'hand';

interface PresentationContextValue {
  isPresenting: boolean;
  togglePresentation: () => void;
  presentationTool: PresentationTool;
  setPresentationTool: (tool: PresentationTool) => void;
}

const PresentationContext = createContext<PresentationContextValue>({
  isPresenting: false,
  togglePresentation: () => {},
  presentationTool: 'laser',
  setPresentationTool: () => {},
});

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [isPresenting, setIsPresenting] = useState(false);
  const [presentationTool, setPresentationTool] = useState<PresentationTool>('laser');

  const togglePresentation = useCallback(() => {
    if (!isPresenting) {
      document.documentElement.requestFullscreen().then(() => {
        setIsPresenting(true);
        setPresentationTool('laser');
      }).catch(() => {
        setIsPresenting(true);
        setPresentationTool('laser');
      });
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      setIsPresenting(false);
    }
  }, [isPresenting]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isPresenting) {
        setIsPresenting(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isPresenting]);

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove('presenting-mode', 'laser-active', 'hand-active');
    if (isPresenting) {
      el.classList.add('presenting-mode');
      el.classList.add(presentationTool === 'laser' ? 'laser-active' : 'hand-active');
    }
    return () => el.classList.remove('presenting-mode', 'laser-active', 'hand-active');
  }, [isPresenting, presentationTool]);

  return (
    <PresentationContext.Provider value={{ isPresenting, togglePresentation, presentationTool, setPresentationTool }}>
      {children}
    </PresentationContext.Provider>
  );
}

export function usePresentation() {
  return useContext(PresentationContext);
}
