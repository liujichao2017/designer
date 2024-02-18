import React, { useEffect, useState } from 'react';
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"


const Modal = ({ isVisible, title, content, onOk, onCancel }) => {
  if (!isVisible) return null;

  return (
    <div>
        <Alert>
            <AlertTitle>{title}</AlertTitle>
            <AlertDescription>
            {content}
            </AlertDescription>
        </Alert>
         <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onOk}>OK</button>
        </div>
    </div>
  )
};


const Confirm = ({ title, content, onOk, onCancel }) => {
    const ConfirmModal = () => {
      const [isVisible, setIsVisible] = useState(false);
  
      useEffect(() => {
        setIsVisible(true); // 组件挂载时显示模态框
      }, []);
  
      const handleOk = () => {
        setIsVisible(false); // 隐藏模态框
        onOk && onOk(); // 调用onOk回调
      };
  
      const handleCancel = () => {
        setIsVisible(false); // 隐藏模态框
        onCancel && onCancel(); // 调用onCancel回调
      };
  
      return (
        <Modal
          isVisible={true}
          title={title}
          content={content}
          onOk={handleOk}
          onCancel={handleCancel}
        />
      );
    };
    return <ConfirmModal />;
  };

export default Confirm;
