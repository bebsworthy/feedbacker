import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ModalPortalProps {
  children: React.ReactNode;
}

export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const elRef = useRef<HTMLDivElement | null>(null);
  
  if (!elRef.current) {
    elRef.current = document.createElement('div');
    elRef.current.className = 'feedbacker-portal';
  }
  
  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    
    return () => {
      document.body.removeChild(el);
    };
  }, []);
  
  return ReactDOM.createPortal(children, elRef.current);
};