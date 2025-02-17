import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

// -----------------------
// IndexedDB Helper Functions
// -----------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open("QuizDB", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("quizHistory")) {
        db.createObjectStore("quizHistory", { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    request.onerror = () => {
      reject("Error opening IndexedDB");
    };
  });
}

async function saveQuizHistory(history) {
  try {
    const db = await openDB();
    const transaction = db.transaction("quizHistory", "readwrite");
    const store = transaction.objectStore("quizHistory");
    store.add(history);
    transaction.oncomplete = () => {
      // console.log("Quiz history saved successfully.");
      Swal.fire({
        title: "Quiz history saved successfully in IndexDB!",
        icon: "success",
        draggable: true
      });
    };
    transaction.onerror = (error) => {
      console.error("Error saving quiz history: ", error);
    };
  } catch (error) {
    console.error("Error in saveQuizHistory:", error);
  }
}

// -----------------------
// Quiz Data & Component
// -----------------------
const quizData = [
  {
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Mercury", "Earth", "Mars"],
    correctAnswer: "Mercury"
  },
  {
    question:
      "Which data structure organizes items in a First-In, First-Out (FIFO) manner?",
    options: ["Stack", "Queue", "Tree", "Graph"],
    correctAnswer: "Queue"
  },
  {
    question: "Which of the following is primarily used for structuring web pages?",
    options: ["Python", "Java", "HTML", "C++"],
    correctAnswer: "HTML"
  },
  {
    question: "Which chemical symbol stands for Gold?",
    options: ["Au", "Gd", "Ag", "Pt"],
    correctAnswer: "Au"
  },
  {
    question:
      "Which of these processes is not typically involved in refining petroleum?",
    options: ["Fractional distillation", "Cracking", "Polymerization", "Filtration"],
    correctAnswer: "Filtration"
  },
  { question: "What is the value of 12 + 28?", correctAnswer: "40" },
  { question: "How many states are there in the United States?", correctAnswer: "50" },
  { question: "In which year was the Declaration of Independence signed?", correctAnswer: "1776" },
  { question: "What is the value of pi rounded to the nearest integer?", correctAnswer: "3" },
  { question: "If a car travels at 60 mph for 2 hours, how many miles does it travel?", correctAnswer: "120" }
];

const QuizPlatform = () => {
  // State declarations
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);
  const [timer, setTimer] = useState(30);
  const [quizFinished, setQuizFinished] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  // Timer effect: counts down while the question isn’t answered correctly.
  useEffect(() => {
    if (!quizFinished && !answeredCorrectly) {
      if (timer > 0) {
        const countdown = setTimeout(() => setTimer((prev) => prev - 1), 1000);
        return () => clearTimeout(countdown);
      } else {
        // If time runs out without any attempt, record a "No Answer" attempt.
        if (currentAttempt === 0) {
          const attemptRecord = {
            question: quizData[currentQuestion].question,
            selectedAnswer: "No Answer",
            isCorrect: false,
            attemptNumber: 1,
            questionIndex: currentQuestion
          };
          setAttempts((prev) => [...prev, attemptRecord]);
        }
        handleNextQuestion();
      }
    }
  }, [timer, quizFinished, answeredCorrectly, currentAttempt, currentQuestion]);

  // Save quiz history in IndexedDB when quiz finishes.
  useEffect(() => {
    if (quizFinished) {
      const history = {
        timestamp: new Date().toISOString(),
        score,
        totalQuestions: quizData.length,
        attempts
      };
      saveQuizHistory(history);
    }
  }, [quizFinished, score, attempts]);

  // Answer selection handler for both multiple-choice and free-text answers.
  const handleAnswerSelection = (answer) => {
    if (answeredCorrectly) return; // Prevent further attempts once correct

    setCurrentAttempt((prev) => prev + 1);
    const correctAnswer = quizData[currentQuestion].correctAnswer.toString().trim().toLowerCase();
    const givenAnswer = answer.toString().trim().toLowerCase();
    const isCorrect = givenAnswer === correctAnswer;

    const attemptRecord = {
      question: quizData[currentQuestion].question,
      selectedAnswer: answer,
      isCorrect,
      attemptNumber: currentAttempt + 1,
      questionIndex: currentQuestion
    };
    setAttempts((prev) => [...prev, attemptRecord]);

    if (isCorrect) {
      setFeedback("Correct!");
      setAnsweredCorrectly(true);
      setScore((prev) => prev + 1);
    } else {
      setFeedback("Incorrect, try again!");
    }
  };

  // Moves to the next question or ends the quiz.
  const handleNextQuestion = () => {
    setCurrentAttempt(0);
    setFeedback("");
    setAnsweredCorrectly(false);
    setTimer(30);
    setTextAnswer("");

    if (currentQuestion + 1 < quizData.length) {
      setCurrentQuestion((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  // Restart the quiz.
  const restartQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setAttempts([]);
    setTimer(30);
    setQuizFinished(false);
    setFeedback("");
    setAnsweredCorrectly(false);
    setCurrentAttempt(0);
    setTextAnswer("");
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {!quizFinished ? (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-bold mb-4 text-purple-600">
              {quizData[currentQuestion].question}
            </h2>
            {quizData[currentQuestion].options ? (
              // Multiple-choice question
              <ul>
                {quizData[currentQuestion].options.map((option, index) => (
                  <motion.li
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-2 border rounded cursor-pointer my-2 ${
                      answeredCorrectly
                        ? "opacity-50 cursor-default bg-gray-200"
                        : "bg-white hover:bg-blue-100"
                    }`}
                    onClick={() => handleAnswerSelection(option)}
                  >
                    {option}
                  </motion.li>
                ))}
              </ul>
            ) : (
              // Free-text answer question
              <motion.div className="my-4">
                <input
                  type="text"
                  className="border p-2 rounded w-full"
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={answeredCorrectly}
                  placeholder="Type your answer here..."
                />
                <motion.button
                  className="btn mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (textAnswer.trim() !== "") {
                      handleAnswerSelection(textAnswer);
                      setTextAnswer("");
                    }
                  }}
                  disabled={answeredCorrectly || textAnswer.trim() === ""}
                >
                  Submit Answer
                </motion.button>
              </motion.div>
            )}
            <p className="mt-2 text-green-600">Time left: {timer}s</p>
            <p className="mt-2 font-semibold text-red-500">{feedback}</p>
            <div className="mt-4">
              {answeredCorrectly ? (
                <motion.button
                  className="btn mr-2 bg-green-500 text-white px-4 py-2 rounded"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                >
                  Next
                </motion.button>
              ) : (
                <motion.button
                  className="btn mr-2 bg-yellow-500 text-white px-4 py-2 rounded"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextQuestion}
                >
                  Skip
                </motion.button>
              )}
            </div>
          </motion.div>
        ) : (
          // Quiz Summary Screen
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-purple-700">Quiz Completed</h2>
            <p className="mt-2 text-blue-600">
              Your score: {score} / {quizData.length}
            </p>
            <h3 className="mt-4 text-xl font-semibold">Attempt History</h3>
            <div className="mt-2 overflow-auto max-h-64">
              <table className="min-w-full border">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border px-2 py-1">Question</th>
                    <th className="border px-2 py-1">Attempt #</th>
                    <th className="border px-2 py-1">Selected Answer</th>
                    <th className="border px-2 py-1">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <td className="border px-2 py-1">{attempt.question}</td>
                      <td className="border px-2 py-1">{attempt.attemptNumber}</td>
                      <td className="border px-2 py-1">{attempt.selectedAnswer}</td>
                      <td className="border px-2 py-1">
                        {attempt.isCorrect ? "Correct" : "Incorrect"}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <motion.button
              className="btn mt-4 bg-red-500 text-white px-4 py-2 rounded"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={restartQuiz}
            >
              Retry Quiz
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default QuizPlatform;
