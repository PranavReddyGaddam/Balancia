import { useState, useRef, useEffect } from "react";
import { useStore } from "./store/useStore";
import { apiService } from "./services/api";
import ItemsTable from "./components/ItemsTable";
import PeopleManager from "./components/PeopleManager.tsx";
import ItemAllocationPage from "./components/ItemAllocationPage";
import ResultsPage from "./components/ResultsPage.tsx";
import BillSettings from "./components/BillSettings.tsx";

function App() {
  const { allocations, setItems, setError, isLoading, setIsLoading } =
    useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const phrases = [
    "Scanning your receipt…",
    "Extracting items and prices…",
    "Catching sneaky taxes…",
    "Splitting fairly (no favorites, promise)…",
    "Matching items to friends…",
    "Balancing the books…",
    "Plating the results… almost there!",
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [typedText, setTypedText] = useState("");

  // Typewriter + cycling text while loading/leaving
  useEffect(() => {
    const active = isLoading || isLeaving;
    if (!active) {
      setTypedText("");
      setPhraseIndex(0);
      return;
    }
    let charIndex = 0;
    let cancelled = false;
    const type = () => {
      if (cancelled) return;
      const current = phrases[phraseIndex % phrases.length];
      if (charIndex <= current.length) {
        setTypedText(current.slice(0, charIndex));
        charIndex += 1;
        setTimeout(type, 25);
      } else {
        // pause then next phrase
        setTimeout(() => {
          if (cancelled) return;
          setPhraseIndex((i) => (i + 1) % phrases.length);
          setTypedText("");
          charIndex = 0;
          type();
        }, 1500);
      }
    };
    type();
    return () => {
      cancelled = true;
    };
  }, [isLoading, isLeaving]);

  const steps = [
    { id: 1, name: "Upload Receipt", component: null },
    {
      id: 2,
      name: "Review Items",
      component: (
        <ItemsTable
          onNext={() => setCurrentStep(3)}
          onBack={() => setCurrentStep(1)}
        />
      ),
    },
    {
      id: 3,
      name: "Add People",
      component: (
        <PeopleManager
          onNext={() => setCurrentStep(4)}
          onBack={() => setCurrentStep(2)}
        />
      ),
    },
    {
      id: 4,
      name: "Allocate Items",
      component: (
        <ItemAllocationPage
          onNext={() => setCurrentStep(5)}
          onBack={() => setCurrentStep(3)}
        />
      ),
    },
    {
      id: 5,
      name: "Settings",
      component: (
        <BillSettings
          onNext={() => setCurrentStep(6)}
          onBack={() => setCurrentStep(4)}
        />
      ),
    },
    {
      id: 6,
      name: "Results",
      component: <ResultsPage onBack={() => setCurrentStep(5)} onNewBill={() => setCurrentStep(1)} />,
    },
  ];

  const currentStepData = steps.find((step) => step.id === currentStep);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setIsLeaving(true);
    setIsLoading(true);
    setError(null);

    try {
      // Create preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Process with OCR
      const result = await apiService.ocr.extract(file);

      // Update store with extracted items
      setItems(
        result.items.map((item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: Number(item.price), // Ensure price is a number
          isTaxable: item.is_taxable,
        }))
      );

      setCurrentStep(2); // Move to next step
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to process image"
      );
    } finally {
      setIsLoading(false);
      setIsLeaving(false);
      // Clean up preview URL after processing is complete
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Camera button removed; upload supports camera selection on mobile natively

  // Lock scroll on landing
  useEffect(() => {
    if (currentStep === 1) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [currentStep]);

  const isLanding = currentStep === 1;

  return (
    <div className={`${isLanding ? 'h-screen overflow-hidden' : 'min-h-screen'} w-full bg-gradient-to-b from-slate-900 via-blue-900 to-sky-200 relative`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
          }}
        ></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-none">
        {/* Navbar */}
        <nav className="w-full px-6 py-4">
          <div className="max-w-[105rem] mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <h2 
                className="text-4xl font-bold text-white cursor-pointer hover:text-white/80 transition-colors duration-200"
                onClick={() => setCurrentStep(1)}
              >
                Balancia
              </h2>
            </div>
          </div>
        </nav>

        {isLanding ? (
          /* Landing Page Layout */
          <div className="h-full flex flex-col lg:flex-row items-center justify-between max-w-[105rem] mx-auto px-4 sm:px-8 lg:px-12 pt-2 sm:pt-8 lg:pt-12">
            {/* Left Column - Content */}
            <div className={`w-full lg:w-1/2 lg:pr-16 mb-2 sm:mb-6 lg:mb-0 pl-4 sm:pl-8 lg:pl-12 transform-gpu transition-all duration-700 ease-out ${isLeaving ? "-translate-x-16 opacity-0" : "translate-x-0 opacity-100"}`}>
              {/* Header */}
              <header className="mb-4 sm:mb-8 lg:mb-12 text-center lg:text-left">
                <h1 className="text-3xl sm:text-6xl lg:text-7xl font-bold text-white mb-2 sm:mb-4 lg:mb-8 leading-tight">
                  Split bills smarter,
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                    not harder.
                  </span>
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-white/80 leading-relaxed max-w-lg mx-auto lg:mx-0 mb-4 sm:mb-8 lg:mb-10">
                  Smart bill splitting with OCR. Upload receipts, allocate
                  items, and split expenses effortlessly.
                </p>
              </header>

              {/* Camera and Upload Buttons */}
              <div className="mb-4 sm:mb-8 lg:mb-12">
                <div className="flex flex-row flex-wrap gap-2 sm:gap-4 lg:gap-6 items-center justify-center sm:justify-start">
                  <button
                    onClick={openFileDialog}
                    disabled={isLoading}
                    className="bg-white/20 backdrop-blur-sm text-white px-2 sm:px-5 lg:px-7 py-1 sm:py-2 lg:py-3 rounded-lg sm:rounded-xl font-medium hover:bg-white/30 transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center justify-center gap-2 sm:gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm lg:text-base w-[140px] sm:w-auto"
                  >
                    <svg
                      className="w-6 h-6 sm:w-4 sm:h-4 lg:w-7 lg:h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    {isLoading ? "Processing..." : "Upload Image"}
                  </button>
                </div>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>

              {/* Results Preview */}
              {allocations.length > 0 && (
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-3 sm:p-6">
                  <h3 className="text-sm sm:text-lg font-semibold text-white mb-3 sm:mb-4">
                    Preview Results
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {allocations.map((allocation) => (
                      <div
                        key={allocation.personId}
                        className="bg-white/20 backdrop-blur-sm p-2 sm:p-4 rounded-xl border border-white/20 hover:bg-white/30 transition-all duration-300"
                      >
                        <h4 className="font-semibold text-white mb-1 sm:mb-2 text-xs sm:text-sm">
                          {allocation.personName}
                        </h4>
                        <p className="text-base sm:text-lg font-bold text-yellow-400">
                          ${allocation.total.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Dashboard Showcase */}
            <div className={`w-full lg:w-1/2 lg:pl-16 relative flex flex-col lg:flex-row items-center justify-center gap-4 pr-4 sm:pr-8 lg:pr-12 transform-gpu transition-all duration-700 ease-out ${isLeaving ? "translate-x-16 opacity-0" : "translate-x-0 opacity-100"}`}>
              {/* Main Dashboard Card */}
              <div className="transform rotate-6 -translate-x-2 translate-y-3 lg:rotate-6 lg:translate-x-0 lg:translate-y-0 relative z-10 lg:-mr-8 scale-95 sm:scale-100 lg:scale-100">
                <div className="bg-white/15 backdrop-blur-md rounded-3xl p-3 sm:p-6 lg:p-8 border border-white/25 shadow-2xl w-60 sm:w-72 lg:w-96">
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-2 sm:mb-4 lg:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full"></div>
                      <h3 className="text-white font-semibold text-xs sm:text-sm lg:text-base"> Dashboard</h3>
                    </div>
                    <div className="flex gap-1 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full"></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full"></div>
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 rounded-full"></div>
                    </div>
                  </div>

                  {/* Main Chart Area */}
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl p-2 sm:p-4 lg:p-6 mb-2 sm:mb-4 lg:mb-6">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
                      <h4 className="text-white font-medium text-xs sm:text-sm">Monthly Expenses</h4>
                      <div className="text-green-400 text-xs font-medium">+12.5%</div>
                    </div>
                    {/* Chart Bars */}
                    <div className="flex items-end gap-1 sm:gap-2 h-10 sm:h-16 lg:h-24">
                      <div className="bg-white/30 rounded-t w-2 sm:w-3 lg:w-4 h-2 sm:h-4 lg:h-8"></div>
                      <div className="bg-white/40 rounded-t w-2 sm:w-3 lg:w-4 h-3 sm:h-6 lg:h-12"></div>
                      <div className="bg-white/50 rounded-t w-2 sm:w-3 lg:w-4 h-4 sm:h-8 lg:h-16"></div>
                      <div className="bg-white/60 rounded-t w-2 sm:w-3 lg:w-4 h-6 sm:h-10 lg:h-20"></div>
                      <div className="bg-white/70 rounded-t w-2 sm:w-3 lg:w-4 h-4 sm:h-8 lg:h-14"></div>
                      <div className="bg-white/80 rounded-t w-2 sm:w-3 lg:w-4 h-8 sm:h-12 lg:h-18"></div>
                      <div className="bg-white/90 rounded-t w-2 sm:w-3 lg:w-4 h-3 sm:h-6 lg:h-10"></div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-4 lg:mb-6">
                    <div className="bg-white/10 rounded-xl p-2 sm:p-3 lg:p-4">
                      <div className="text-white/60 text-xs mb-1">Total Split</div>
                      <div className="text-white font-bold text-sm sm:text-base lg:text-lg">$1,247</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 sm:p-3 lg:p-4">
                      <div className="text-white/60 text-xs mb-1">Members</div>
                      <div className="text-white font-bold text-sm sm:text-base lg:text-lg">6</div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white/10 rounded-xl p-2 sm:p-3 lg:p-4">
                    <h4 className="text-white font-medium mb-2 sm:mb-3 text-xs sm:text-sm">Recent Activity</h4>
                    <div className="space-y-1 sm:space-y-1.5 lg:space-y-2">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></div>
                        <div className="text-white/80 text-xs">Pranav paid $45.20</div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"></div>
                        <div className="text-white/80 text-xs">New bill added</div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full"></div>
                        <div className="text-white/80 text-xs">Group updated</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Dashboard Card */}
              <div className="transform -rotate-6 translate-x-2 -translate-y-6 lg:-rotate-6 lg:translate-x-0 lg:translate-y-0 relative z-0 lg:z-10 lg:-ml-8 scale-95 sm:scale-100 lg:scale-100">
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-2 sm:p-4 lg:p-6 border border-white/20 shadow-xl w-52 sm:w-60 lg:w-80">
                  {/* Analytics Header */}
                  <div className="flex items-center justify-between mb-2 sm:mb-4 lg:mb-5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full"></div>
                      <h3 className="text-white font-semibold text-xs sm:text-sm">Analytics</h3>
                    </div>
                    <div className="text-orange-400 text-xs">Live</div>
                  </div>

                  {/* Circular Progress */}
                  <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl p-2 sm:p-3 lg:p-5 mb-2 sm:mb-4 lg:mb-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h4 className="text-white font-medium text-xs">Split Progress</h4>
                      <div className="text-orange-400 text-xs font-medium">78%</div>
                    </div>
                    {/* Progress Ring */}
                    <div className="relative w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-3 sm:border-4 border-white/20"></div>
                      <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-3 sm:border-4 border-orange-400 border-t-transparent transform -rotate-90" style={{clipPath: 'polygon(50% 0%, 100% 0%, 100% 100%, 50% 100%)'}}></div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="space-y-2 sm:space-y-3 mb-2 sm:mb-4 lg:mb-5">
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-xs">Pending</span>
                      <span className="text-white font-semibold text-xs sm:text-sm">$234</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-xs">Completed</span>
                      <span className="text-white font-semibold text-xs sm:text-sm">$1,013</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/70 text-xs">Efficiency</span>
                      <span className="text-green-400 font-semibold text-xs sm:text-sm">94%</span>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white/10 rounded-xl p-2 sm:p-3 lg:p-4">
                    <h4 className="text-white font-medium text-xs mb-2 sm:mb-3">Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                      <div className="bg-white/20 rounded-lg p-1.5 sm:p-2 text-center">
                        <div className="text-white/80 text-xs">Add Bill</div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-1.5 sm:p-2 text-center">
                        <div className="text-white/80 text-xs">Invite</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Full Screen Workflow Layout */
          <div className="w-full min-h-screen flex items-start justify-center px-4 pt-8 pb-4">
            <main className="w-full max-w-6xl bg-white/20 backdrop-blur-md shadow-2xl rounded-2xl p-8 border border-white/20">
              {currentStepData?.component}
            </main>
          </div>
        )}
      </div>

      {/* Center Overlay: playful processing text */}
      {(isLoading || isLeaving) && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl px-6 py-5 shadow-xl flex flex-col items-center text-center max-w-lg mx-auto">
            <div className="text-white/90 text-lg sm:text-xl font-semibold tracking-wide">
              {typedText}
              <span className="inline-flex ml-1">
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full mr-1 animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full mr-1 animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
              </span>
            </div>
            <div className="mt-3 text-white/60 text-xs sm:text-sm">We’re preparing your bill for a fair split.</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
