'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const StudentFlowContext = createContext({
  selectedUniversity: null,
  setSelectedUniversity: () => {},
  capturedFaceImage: null,
  setCapturedFaceImage: () => {},
  registrationData: {},
  setRegistrationData: () => {},
});

export function StudentFlowProvider({ children }) {
  const [selectedUniversity, setSelectedUniversityState] = useState(null);
  const [capturedFaceImage, setCapturedFaceImage] = useState(null);
  const [registrationData, setRegistrationDataState] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUni = localStorage.getItem('selected_university');
      if (storedUni) {
        try {
          setSelectedUniversityState(JSON.parse(storedUni));
        } catch (e) {
          console.error('Error parsing stored university:', e);
        }
      }
      const storedFace = sessionStorage.getItem('captured_face_image');
      if (storedFace) {
        setCapturedFaceImage(storedFace);
      }
    }
  }, []);

  const setSelectedUniversity = (uni) => {
    setSelectedUniversityState(uni);
    if (typeof window !== 'undefined') {
      if (uni) {
        localStorage.setItem('selected_university', JSON.stringify(uni));
      } else {
        localStorage.removeItem('selected_university');
      }
    }
  };

  const setCapturedFace = (imgDataUrl) => {
    setCapturedFaceImage(imgDataUrl);
    if (typeof window !== 'undefined') {
      if (imgDataUrl) {
        sessionStorage.setItem('captured_face_image', imgDataUrl);
      } else {
        sessionStorage.removeItem('captured_face_image');
      }
    }
  };

  const setRegistrationData = (data) => {
    setRegistrationDataState((prev) => ({ ...prev, ...data }));
  };

  return (
    <StudentFlowContext.Provider
      value={{
        selectedUniversity,
        setSelectedUniversity,
        capturedFaceImage,
        setCapturedFaceImage: setCapturedFace,
        registrationData,
        setRegistrationData,
      }}
    >
      {children}
    </StudentFlowContext.Provider>
  );
}

export function useStudentFlow() {
  return useContext(StudentFlowContext);
}
