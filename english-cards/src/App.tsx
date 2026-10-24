import { useState, useEffect, useMemo } from 'react';
import { WordCard, Difficulty } from './types';
import { initialWords } from './data/defaultWords';
import {
  createCacheItem,
  Customer,
  Admin,
  isAdmin,
  checkAccess,
} from './homework';

const STORAGE_KEY = 'english_cards_words_v2';

export default function App() {
  const [words, setWords] = useState<WordCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        return initialWords;
      }
    }
    return initialWords;
  });

  const [activeTab, setActiveTab] = useState<'learn' | 'admin'>('learn');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);
  const [learnedIds, setLearnedIds] = useState<string[]>([]);

  const [currentUser, setCurrentUser] = useState<Customer | Admin>({
    type: 'admin',
    role: 'Преподаватель / Администратор',
    permissions: ['add_words', 'delete_words'],
  });

  const [newRu, setNewRu] = useState('');
  const [newEn, setNewEn] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>('easy');
  const [newOpt2, setNewOpt2] = useState('');
  const [newOpt3, setNewOpt3] = useState('');
  const [newOpt4, setNewOpt4] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, [words]);

  const filteredWords = useMemo(() => {
    if (selectedDifficulty === 'all') return words;
    return words.filter((w) => w.difficulty === selectedDifficulty);
  }, [words, selectedDifficulty]);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSelectedOption(null);
    setIsAnswerCorrect(null);
  }, [selectedDifficulty]);

  const currentWord = filteredWords[currentIndex] || filteredWords[0] || null;

  const shuffledOptions = useMemo(() => {
    if (!currentWord) return [];
    const list = [...currentWord.options];
    if (!list.includes(currentWord.en)) {
      list[0] = currentWord.en;
    }
    return list;
  }, [currentWord]);

  const handleNext = () => {
    if (filteredWords.length === 0) return;
    setIsFlipped(false);
    setSelectedOption(null);
    setIsAnswerCorrect(null);
    setCurrentIndex((prev) => (prev + 1) % filteredWords.length);
  };

  const handlePrev = () => {
    if (filteredWords.length === 0) return;
    setIsFlipped(false);
    setSelectedOption(null);
    setIsAnswerCorrect(null);
    setCurrentIndex((prev) => (prev - 1 + filteredWords.length) % filteredWords.length);
  };

  const handleRandom = () => {
    if (filteredWords.length <= 1) return;
    setIsFlipped(false);
    setSelectedOption(null);
    setIsAnswerCorrect(null);
    let next = Math.floor(Math.random() * filteredWords.length);
    if (next === currentIndex) {
      next = (next + 1) % filteredWords.length;
    }
    setCurrentIndex(next);
  };

  const handleOptionClick = (option: string) => {
    if (isFlipped) return;
    setSelectedOption(option);

    if (option.trim().toLowerCase() === currentWord.en.trim().toLowerCase()) {
      setIsAnswerCorrect(true);
      setTimeout(() => {
        setIsFlipped(true);
        if (!learnedIds.includes(currentWord.id)) {
          setLearnedIds((prev) => {
            const updated = [...prev, currentWord.id];
            createCacheItem('learned_total', updated.length);
            return updated;
          });
        }
      }, 350);
    } else {
      setIsAnswerCorrect(false);
      setTimeout(() => {
        setIsAnswerCorrect(null);
      }, 700);
    }
  };

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRu.trim() || !newEn.trim()) return;

    const opt2 = newOpt2.trim() || 'Choice 2';
    const opt3 = newOpt3.trim() || 'Choice 3';
    const opt4 = newOpt4.trim() || 'Choice 4';

    const newCard: WordCard = {
      id: Date.now().toString(),
      ru: newRu.trim(),
      en: newEn.trim(),
      difficulty: newDifficulty,
      options: [newEn.trim(), opt2, opt3, opt4],
    };

    setWords((prev) => [newCard, ...prev]);
    setNewRu('');
    setNewEn('');
    setNewOpt2('');
    setNewOpt3('');
    setNewOpt4('');
    alert('Слово успешно добавлено!');
  };

  const handleDeleteWord = (id: string) => {
    if (confirm('Удалить это слово?')) {
      setWords((prev) => prev.filter((w) => w.id !== id));
      if (currentIndex >= filteredWords.length - 1) {
        setCurrentIndex(0);
      }
    }
  };

  const handleResetWords = () => {
    if (confirm('Сбросить базу к исходным 100 словам?')) {
      setWords(initialWords);
      localStorage.removeItem(STORAGE_KEY);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSelectedOption(null);
      setIsAnswerCorrect(null);
    }
  };

  return (
    <div className="h-screen w-full bg-neutral-100 text-neutral-900 font-sans flex flex-col justify-between overflow-hidden">
      <header className="w-full border-b border-neutral-300 bg-white px-4 py-2 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold tracking-tight">English Cards</h1>
          <span className="text-[11px] text-neutral-400 border-l border-neutral-300 pl-2">
            100 слов
          </span>
        </div>

        <nav className="flex items-center gap-1 border border-neutral-300 rounded-lg p-0.5 bg-neutral-50 text-xs">
          <button
            onClick={() => setActiveTab('learn')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'learn'
                ? 'bg-neutral-900 text-white font-medium'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Карточки
          </button>
          <button
            onClick={() => {
              setActiveTab('admin');
              checkAccess(currentUser);
            }}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeTab === 'admin'
                ? 'bg-neutral-900 text-white font-medium'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Админ-панель
          </button>
        </nav>
      </header>

      <main className="w-full flex-1 flex flex-col items-center justify-center p-3 overflow-y-auto">
        {activeTab === 'learn' && (
          <div className="w-full max-w-sm flex flex-col items-center my-auto">
            <div className="w-full flex items-center justify-between gap-1 mb-2">
              <div className="flex gap-1 bg-white border border-neutral-300 p-0.5 rounded-lg text-[11px]">
                {(
                  [
                    ['all', 'Все'],
                    ['easy', 'Легкий'],
                    ['medium', 'Средний'],
                    ['hard', 'Сложный'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedDifficulty(key)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      selectedDifficulty === key
                        ? 'bg-neutral-900 text-white font-medium'
                        : 'text-neutral-600 hover:bg-neutral-100'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-neutral-500 bg-white border border-neutral-300 px-2 py-0.5 rounded-lg">
                Выучено: {learnedIds.filter((id) => filteredWords.some((w) => w.id === id)).length}
              </div>
            </div>

            {filteredWords.length === 0 ? (
              <div className="w-full border border-dashed border-neutral-300 rounded-xl p-6 text-center bg-white">
                <p className="text-neutral-500 text-xs mb-3">
                  Нет слов для выбранного уровня сложности.
                </p>
                <button
                  onClick={() => setSelectedDifficulty('all')}
                  className="px-3 py-1.5 bg-neutral-900 text-white text-xs rounded-md"
                >
                  Показать все слова
                </button>
              </div>
            ) : (
              <>
                <div className="w-full flex items-center justify-between gap-2 mb-2 bg-white border border-neutral-300 px-2.5 py-1.5 rounded-xl text-xs shadow-xs">
                  <button
                    onClick={handlePrev}
                    className="px-2.5 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100 text-neutral-700 font-medium active:scale-95 transition-all text-xs"
                  >
                    &larr; Назад
                  </button>

                  <div className="text-center font-medium text-neutral-800 text-xs">
                    Слово {currentIndex + 1} из {filteredWords.length}
                  </div>

                  <button
                    onClick={handleNext}
                    className="px-2.5 py-1 border border-neutral-300 rounded-md hover:bg-neutral-100 text-neutral-700 font-medium active:scale-95 transition-all text-xs"
                  >
                    Вперед &rarr;
                  </button>
                </div>

                <div
                  className={`w-full aspect-[1/0.78] max-w-[340px] perspective-1000 my-1 ${
                    isAnswerCorrect === false ? 'animate-shake' : ''
                  }`}
                >
                  <div
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className={`relative w-full h-full cursor-pointer transition-transform duration-500 transform-style-3d ${
                      isFlipped ? 'rotate-y-180' : ''
                    }`}
                  >
                    <div
                      className={`absolute inset-0 backface-hidden bg-white border-2 rounded-xl p-3.5 flex flex-col justify-between items-center text-center shadow-xs select-none transition-colors ${
                        isAnswerCorrect === true
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 animate-success'
                          : isAnswerCorrect === false
                          ? 'border-red-500 ring-2 ring-red-500/20'
                          : 'border-neutral-300 hover:border-neutral-500'
                      }`}
                    >
                      <div className="w-full flex justify-between items-center text-[11px]">
                        <span className="px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {currentWord.difficulty === 'easy'
                            ? 'Легкий'
                            : currentWord.difficulty === 'medium'
                            ? 'Средний'
                            : 'Сложный'}
                        </span>
                        <span className="text-neutral-400 text-[10px]">Русский</span>
                      </div>

                      <div className="my-auto px-1">
                        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 leading-tight">
                          {currentWord.ru}
                        </h2>
                      </div>

                      <div className="text-[11px] text-neutral-400">
                        {isAnswerCorrect === false ? (
                          <span className="text-red-600 font-medium">Неверно, попробуйте еще!</span>
                        ) : isAnswerCorrect === true ? (
                          <span className="text-emerald-700 font-medium">Верно!</span>
                        ) : (
                          <span>Кликните для перевода или выберите вариант</span>
                        )}
                      </div>
                    </div>

                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-neutral-900 text-white border-2 border-neutral-900 rounded-xl p-3.5 flex flex-col justify-between items-center text-center shadow-xs select-none">
                      <div className="w-full flex justify-between items-center text-[11px]">
                        <span className="px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
                          English
                        </span>
                        <span className="text-neutral-400 text-[10px]">Перевод</span>
                      </div>

                      <div className="my-auto px-1">
                        <h2 className="text-2xl font-bold tracking-tight text-white leading-tight">
                          {currentWord.en}
                        </h2>
                        <p className="text-xs text-neutral-400 mt-1">«{currentWord.ru}»</p>
                      </div>

                      <div className="text-[10px] text-neutral-400">
                        <span>Нажмите, чтобы повернуть обратно</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full mt-2 bg-white border border-neutral-300 rounded-xl p-2.5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wide">
                      Варианты:
                    </span>
                    <button
                      onClick={handleRandom}
                      className="text-[11px] text-neutral-500 hover:text-neutral-800 transition-colors"
                    >
                      🎲 Случайное
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {shuffledOptions.map((opt, idx) => {
                      const isCorrect = opt.trim().toLowerCase() === currentWord.en.trim().toLowerCase();
                      const isSelected = selectedOption === opt;

                      let btnStyle = 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100 hover:border-neutral-400';

                      if (isSelected && isAnswerCorrect === false) {
                        btnStyle = 'bg-red-50 text-red-700 border-red-500 animate-shake';
                      } else if (isSelected && isAnswerCorrect === true) {
                        btnStyle = 'bg-emerald-50 text-emerald-800 border-emerald-600 font-semibold animate-success';
                      } else if (isFlipped && isCorrect) {
                        btnStyle = 'bg-neutral-900 text-white border-neutral-900 font-semibold';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleOptionClick(opt)}
                          className={`py-2 px-2.5 text-xs border rounded-lg text-center font-medium transition-all active:scale-95 truncate ${btnStyle}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full mt-2 flex items-center justify-center">
                  <button
                    onClick={() => setIsFlipped((prev) => !prev)}
                    className="w-full py-1.5 border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg text-xs font-medium transition-colors"
                  >
                    {isFlipped ? 'Скрыть перевод' : 'Перевернуть карточку'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="w-full max-w-xl bg-white border border-neutral-300 rounded-xl p-4 shadow-xs my-auto max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2 mb-3 gap-2 shrink-0">
              <h2 className="text-sm font-bold">Панель администратора</h2>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const newUser: Customer | Admin =
                      currentUser.type === 'admin'
                        ? { type: 'customer', email: 'student@study.edu' }
                        : {
                            type: 'admin',
                            role: 'Преподаватель',
                            permissions: ['add_words', 'delete_words'],
                          };
                    setCurrentUser(newUser);
                    checkAccess(newUser);
                  }}
                  className="text-[11px] px-2 py-1 border border-neutral-300 rounded hover:bg-neutral-50 text-neutral-700"
                >
                  Роль: {currentUser.type === 'admin' ? 'Админ' : 'Студент'}
                </button>
                <button
                  type="button"
                  onClick={handleResetWords}
                  className="text-[11px] px-2 py-1 border border-neutral-200 rounded hover:bg-neutral-100 text-neutral-500"
                >
                  Сбросить к 100
                </button>
              </div>
            </div>

            <div className="overflow-y-auto pr-1 flex-1">
              {!isAdmin(currentUser) ? (
                <div className="p-4 border border-neutral-200 bg-neutral-50 rounded-lg text-center">
                  <p className="text-xs text-neutral-700 font-medium">Доступ ограничен (Customer)</p>
                  <p className="text-[11px] text-neutral-500 my-2">
                    Учетная запись: {currentUser.email}.
                  </p>
                  <button
                    onClick={() => {
                      const adminUser: Admin = {
                        type: 'admin',
                        role: 'Преподаватель',
                        permissions: ['add_words', 'delete_words'],
                      };
                      setCurrentUser(adminUser);
                      checkAccess(adminUser);
                    }}
                    className="px-3 py-1 bg-neutral-900 text-white rounded text-xs"
                  >
                    Войти как Admin
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddWord} className="space-y-2 mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                        На русском:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Город"
                        value={newRu}
                        onChange={(e) => setNewRu(e.target.value)}
                        className="w-full border border-neutral-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                        На английском:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={newEn}
                        onChange={(e) => setNewEn(e.target.value)}
                        className="w-full border border-neutral-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-neutral-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <div className="col-span-1">
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                        Сложность:
                      </label>
                      <select
                        value={newDifficulty}
                        onChange={(e) => setNewDifficulty(e.target.value as Difficulty)}
                        className="w-full border border-neutral-300 rounded-md px-1 py-1 text-xs bg-white"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="col-span-3">
                      <label className="block text-[11px] font-semibold text-neutral-700 mb-0.5">
                        3 других варианта:
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        <input
                          type="text"
                          placeholder="Town"
                          value={newOpt2}
                          onChange={(e) => setNewOpt2(e.target.value)}
                          className="border border-neutral-300 rounded px-1.5 py-1 text-[11px]"
                        />
                        <input
                          type="text"
                          placeholder="Village"
                          value={newOpt3}
                          onChange={(e) => setNewOpt3(e.target.value)}
                          className="border border-neutral-300 rounded px-1.5 py-1 text-[11px]"
                        />
                        <input
                          type="text"
                          placeholder="Country"
                          value={newOpt4}
                          onChange={(e) => setNewOpt4(e.target.value)}
                          className="border border-neutral-300 rounded px-1.5 py-1 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-xs font-medium"
                  >
                    + Добавить слово
                  </button>
                </form>
              )}

              <div className="border-t border-neutral-200 pt-2">
                <h3 className="text-xs font-bold text-neutral-800 mb-2">
                  Слова в базе ({words.length}):
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {words.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center justify-between border border-neutral-200 rounded p-1.5 text-xs hover:border-neutral-300"
                    >
                      <div>
                        <span className="font-medium text-neutral-900">{w.ru}</span>
                        <span className="text-neutral-400 mx-1">—</span>
                        <span className="font-semibold text-neutral-800">{w.en}</span>
                        <span className="ml-1.5 px-1 py-0.2 rounded bg-neutral-100 text-neutral-500 text-[10px]">
                          {w.difficulty}
                        </span>
                      </div>
                      {isAdmin(currentUser) && (
                        <button
                          onClick={() => handleDeleteWord(w.id)}
                          className="text-neutral-400 hover:text-red-600 text-[11px]"
                        >
                          Удалить
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full border-t border-neutral-300 py-1.5 px-4 text-center text-[10px] text-neutral-400 bg-white shrink-0">
        English Cards &bull; 100 слов &bull; 2026
      </footer>
    </div>
  );
}
