/**
 * PlaygroundV2 - Improved playground with framework demos and feedback panel
 */

import React, { useState } from 'react';
import { useFeedbackEvent } from 'feedbacker-react';
import { MUIDemo } from './frameworks/mui/MUIDemo';
import { AntDesignDemo } from './frameworks/antd/AntDesignDemo';
import { ChakraUIDemo } from './frameworks/chakra/ChakraUIDemo';
import { FeedbackPanel } from './FeedbackPanel';

type Framework = 'mui' | 'antd' | 'chakra';

interface PlaygroundV2Props {
  captureLibrary: 'html2canvas' | 'snapdom';
  setCaptureLibrary: (library: 'html2canvas' | 'snapdom') => void;
}

export const PlaygroundV2: React.FC<PlaygroundV2Props> = ({ captureLibrary, setCaptureLibrary }) => {
  const [activeFramework, setActiveFramework] = useState<Framework>('mui');
  const { emit } = useFeedbackEvent();

  const handleActivateFeedback = () => {
    emit('selection:start', {});
  };

  const renderDemo = () => {
    switch (activeFramework) {
      case 'mui':
        return <MUIDemo />;
      case 'antd':
        return <AntDesignDemo />;
      case 'chakra':
        return <ChakraUIDemo />;
      default:
        return <MUIDemo />;
    }
  };

  return (
    <section id="playground" className="playground-v2">
      <div className="playground-header">
        <h2 className="section-title">Interactive Playground</h2>
        <p className="section-subtitle">
          Test Feedbacker with popular UI frameworks. Click components to capture feedback.
        </p>
      </div>

      <div className="playground-controls">
        <div className="framework-tabs">
          <button
            className={`framework-tab ${activeFramework === 'mui' ? 'active' : ''}`}
            onClick={() => setActiveFramework('mui')}
          >
            Material-UI
          </button>
          <button
            className={`framework-tab ${activeFramework === 'antd' ? 'active' : ''}`}
            onClick={() => setActiveFramework('antd')}
          >
            Ant Design
          </button>
          <button
            className={`framework-tab ${activeFramework === 'chakra' ? 'active' : ''}`}
            onClick={() => setActiveFramework('chakra')}
          >
            Chakra UI
          </button>
        </div>
        
        <div className="capture-library-selector">
          <span className="capture-label">Screenshot:</span>
          <div className="capture-tabs">
            <button
              className={`capture-tab ${captureLibrary === 'snapdom' ? 'active' : ''}`}
              onClick={() => setCaptureLibrary('snapdom')}
              title="SnapDOM - Modern, fast screenshot library"
            >
              SnapDOM
            </button>
            <button
              className={`capture-tab ${captureLibrary === 'html2canvas' ? 'active' : ''}`}
              onClick={() => setCaptureLibrary('html2canvas')}
              title="html2canvas - Traditional screenshot library"
            >
              html2canvas
            </button>
          </div>
        </div>
        
        <button
          className="btn btn-primary"
          onClick={handleActivateFeedback}
        >
          🎯 Activate Feedback Mode
        </button>
      </div>

      <div className="playground-content">
        <div className="playground-demo">
          {renderDemo()}
        </div>
        
        <FeedbackPanel className="playground-feedback-panel" captureLibrary={captureLibrary} />
      </div>
    </section>
  );
};