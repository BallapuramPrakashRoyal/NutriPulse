import React from 'react';
import { INITIAL_FOOD_DB, ACTIVITY_LEVELS, GOAL_PRESETS, WORKOUT_TYPES, FASTING_PROTOCOLS, SMART_TEMPLATES } from './data/foodDatabase.js';
import VegBadge from './components/VegBadge.jsx';
import FoodImage, { FALLBACK_FOOD_IMAGE } from './components/FoodImage.jsx';
import { calcFoodCalories } from './constants/nutritionConstants.js';
import { calculateClinicalTargets, checkBackendHealth } from './services/apiClient.js';

/**
 * NutriPulse Pro — Full-Stack Main Application Component
 * Note: For the single-file bundle, you can also paste your full App.jsx directly here.
 * © Ballapuram Prakash Royal. All Rights Reserved.
 */
function App() {
    var _a;
    const sevenDays = (0, import_react3.useMemo)(() => getSevenDayStrip(), []);
    const todayIso = ((_a = sevenDays.find((d) => d.isToday)) == null ? void 0 : _a.iso) || sevenDays[3].iso;
    const [selectedDate, setSelectedDate] = (0, import_react3.useState)(todayIso);
    const [usersDb, setUsersDb] = (0, import_react3.useState)(() => {
      try {
        const saved = localStorage.getItem("nutripulse_users_db_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0)
            return parsed;
        }
      } catch (e) {
        console.error(e);
      }
      return DEMO_USERS;
    });
    const [currentUser, setCurrentUser] = (0, import_react3.useState)(() => {
      try {
        const savedSession = localStorage.getItem("nutripulse_active_session_v1");
        if (savedSession)
          return JSON.parse(savedSession);
      } catch (e) {
        console.error(e);
      }
      return null;
    });
    const [authMode, setAuthMode] = (0, import_react3.useState)("login");
    const [authError, setAuthError] = (0, import_react3.useState)("");
    const [showAccountMenu, setShowAccountMenu] = (0, import_react3.useState)(false);
    const [authForm, setAuthForm] = (0, import_react3.useState)({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      weight: 70,
      height: 172,
      age: 24,
      gender: "male",
      activity: "moderate",
      goal: "maintain"
    });
    const activeUserId = (currentUser == null ? void 0 : currentUser.id) || "guest";
    const [profile, setProfile] = (0, import_react3.useState)(() => DEFAULT_PROFILE);
    const [foodDb, setFoodDb] = (0, import_react3.useState)(() => INITIAL_FOOD_DB);
    const [daysData, setDaysData] = (0, import_react3.useState)(() => buildDefaultDaysMap(sevenDays, 0, 72));
    (0, import_react3.useEffect)(() => {
      var _a2;
      if (!currentUser)
        return;
      const uid = currentUser.id;
      try {
        const savedProf = localStorage.getItem(`nutripulse_profile_v3_${uid}`);
        if (savedProf) {
          setProfile(JSON.parse(savedProf));
        } else if (currentUser.profile) {
          setProfile(__spreadValues(__spreadValues({}, DEFAULT_PROFILE), currentUser.profile));
        } else {
          setProfile(DEFAULT_PROFILE);
        }
      } catch (e) {
        setProfile(DEFAULT_PROFILE);
      }
      try {
        const savedCustomFoods = localStorage.getItem(`nutripulse_custom_foods_v3_${uid}`);
        if (savedCustomFoods) {
          const custom = JSON.parse(savedCustomFoods);
          setFoodDb([...custom, ...INITIAL_FOOD_DB]);
        } else {
          setFoodDb(INITIAL_FOOD_DB);
        }
      } catch (e) {
        setFoodDb(INITIAL_FOOD_DB);
      }
      try {
        const savedDays = localStorage.getItem(`nutripulse_days_v3_${uid}`);
        if (savedDays) {
          setDaysData(JSON.parse(savedDays));
        } else {
          const defaultTplIndex = uid === "user_ananya" ? 1 : 0;
          const defaultW = ((_a2 = currentUser.profile) == null ? void 0 : _a2.weight) || 72;
          setDaysData(buildDefaultDaysMap(sevenDays, defaultTplIndex, defaultW));
        }
      } catch (e) {
        setDaysData(buildDefaultDaysMap(sevenDays, 0, 72));
      }
    }, [currentUser, sevenDays]);
    const currentDayObj = (0, import_react3.useMemo)(() => {
      return daysData[selectedDate] || { meals: [], waterMl: 0, workouts: [], weightKg: profile.weight };
    }, [daysData, selectedDate, profile.weight]);
    const updateCurrentDay = (updater) => {
      setDaysData((prev) => {
        const existing = prev[selectedDate] || { meals: [], waterMl: 0, workouts: [], weightKg: profile.weight };
        const nextVal = typeof updater === "function" ? updater(existing) : __spreadValues(__spreadValues({}, existing), updater);
        return __spreadProps(__spreadValues({}, prev), { [selectedDate]: nextVal });
      });
    };
    const [nowTime, setNowTime] = (0, import_react3.useState)(() => /* @__PURE__ */ new Date());
    (0, import_react3.useEffect)(() => {
      const interval = setInterval(() => setNowTime(/* @__PURE__ */ new Date()), 1e3);
      return () => clearInterval(interval);
    }, []);
    const [activeMealSlot, setActiveMealSlot] = (0, import_react3.useState)("Breakfast");
    const [activeWorkspaceTab, setActiveWorkspaceTab] = (0, import_react3.useState)("planner");
    const [searchQuery, setSearchQuery] = (0, import_react3.useState)("");
    const [selectedCategory, setSelectedCategory] = (0, import_react3.useState)("All");
    const [vegOnly, setVegOnly] = (0, import_react3.useState)(false);
    const [showProfileDrawer, setShowProfileDrawer] = (0, import_react3.useState)(false);
    const [showCustomFoodModal, setShowCustomFoodModal] = (0, import_react3.useState)(false);
    const [showExportModal, setShowExportModal] = (0, import_react3.useState)(false);
    const [showBrandModal, setShowBrandModal] = (0, import_react3.useState)(false);
    const [showQuickCalcModal, setShowQuickCalcModal] = (0, import_react3.useState)(false);
    const [showGithubModal, setShowGithubModal] = (0, import_react3.useState)(false);
    const [zipBusy, setZipBusy] = (0, import_react3.useState)(false);
    const [checkedGroceries, setCheckedGroceries] = (0, import_react3.useState)({});
    const [toastMsg, setToastMsg] = (0, import_react3.useState)(null);
    const [workoutForm, setWorkoutForm] = (0, import_react3.useState)({ typeId: "strength", minutes: 45 });
    const [quickMacro, setQuickMacro] = (0, import_react3.useState)({ name: "Packaged Protein Bar", protein: 20, carbs: 22, fat: 7, fiber: 4, veg: true });
    const [newFood, setNewFood] = (0, import_react3.useState)({
      name: "",
      serving: "100g",
      category: "High Protein",
      protein: "",
      carbs: "",
      fat: "",
      fiber: "",
      veg: true,
      image: CUSTOM_FOOD_GALLERY[0].url
    });
    (0, import_react3.useEffect)(() => {
      try {
        localStorage.setItem("nutripulse_users_db_v1", JSON.stringify(usersDb));
      } catch (e) {
        console.error(e);
      }
    }, [usersDb]);
    (0, import_react3.useEffect)(() => {
      try {
        if (currentUser) {
          localStorage.setItem("nutripulse_active_session_v1", JSON.stringify(currentUser));
        } else {
          localStorage.removeItem("nutripulse_active_session_v1");
        }
      } catch (e) {
        console.error(e);
      }
    }, [currentUser]);
    (0, import_react3.useEffect)(() => {
      if (!currentUser)
        return;
      try {
        localStorage.setItem(`nutripulse_profile_v3_${activeUserId}`, JSON.stringify(profile));
      } catch (e) {
        console.error(e);
      }
    }, [profile, currentUser, activeUserId]);
    (0, import_react3.useEffect)(() => {
      if (!currentUser)
        return;
      try {
        localStorage.setItem(`nutripulse_days_v3_${activeUserId}`, JSON.stringify(daysData));
      } catch (e) {
        console.error(e);
      }
    }, [daysData, currentUser, activeUserId]);
    const triggerToast = (msg) => {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 2800);
    };
    const handleLoginSubmit = (e) => {
      e.preventDefault();
      setAuthError("");
      const emailClean = authForm.email.trim().toLowerCase();
      const found = usersDb.find(
        (u) => u.email.toLowerCase() === emailClean && u.password === authForm.password
      );
      if (!found) {
        setAuthError("Invalid email or password. Try a demo account below or register a new account.");
        return;
      }
      setCurrentUser(found);
      triggerToast(`Welcome back, ${found.name}!`);
    };
    const handleRegisterSubmit = (e) => {
      e.preventDefault();
      setAuthError("");
      const nameClean = authForm.name.trim();
      const emailClean = authForm.email.trim().toLowerCase();
      if (!nameClean || !emailClean || !authForm.password) {
        setAuthError("Please fill in your name, email, and password.");
        return;
      }
      if (authForm.password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        setAuthError("Passwords do not match.");
        return;
      }
      if (usersDb.some((u) => u.email.toLowerCase() === emailClean)) {
        setAuthError("An account with this email already exists. Please sign in.");
        return;
      }
      const goalPreset = GOAL_PRESETS.find((g) => g.id === authForm.goal) || GOAL_PRESETS[2];
      const newUserProfile = __spreadProps(__spreadValues({}, DEFAULT_PROFILE), {
        weight: Math.max(30, Number(authForm.weight) || 70),
        height: Math.max(120, Number(authForm.height) || 170),
        age: Math.max(14, Number(authForm.age) || 24),
        gender: authForm.gender,
        activity: authForm.activity,
        goal: authForm.goal,
        proteinPct: goalPreset.p,
        carbsPct: goalPreset.c,
        fatPct: goalPreset.f
      });
      const newUser = {
        id: `user_${Date.now()}`,
        name: nameClean,
        email: emailClean,
        password: authForm.password,
        avatarColor: "from-emerald-500 to-teal-500",
        createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        profile: newUserProfile
      };
      setUsersDb((prev) => [newUser, ...prev]);
      setCurrentUser(newUser);
      triggerToast(`Account created! Welcome to NutriPulse Pro, ${newUser.name}!`);
    };
    const handleQuickDemoLogin = (demoUser) => {
      setAuthError("");
      setCurrentUser(demoUser);
      triggerToast(`Signed in as ${demoUser.name}`);
    };
    const handleLogout = () => {
      setShowAccountMenu(false);
      setCurrentUser(null);
      setAuthMode("login");
      setAuthForm((prev) => __spreadProps(__spreadValues({}, prev), { password: "", confirmPassword: "" }));
      triggerToast("Signed out of your NutriPulse Pro session.");
    };
    const copyTextToClipboard = (text, successMessage = "Copied to clipboard!") => __async(this, null, function* () {
      const fallbackCopy = (str) => {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = str;
          textArea.setAttribute("readonly", "");
          textArea.style.position = "fixed";
          textArea.style.top = "-9999px";
          textArea.style.left = "-9999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          const copied = document.execCommand("copy");
          document.body.removeChild(textArea);
          return copied;
        } catch (err) {
          return false;
        }
      };
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          yield navigator.clipboard.writeText(text);
          triggerToast(successMessage);
          return;
        }
      } catch (err) {
      }
      const ok = fallbackCopy(text);
      if (ok) {
        triggerToast(successMessage);
      } else {
        triggerToast("Clipboard ready! Select text to copy.");
      }
    });
    const totalBurnedCalories = (0, import_react3.useMemo)(() => {
      return (currentDayObj.workouts || []).reduce((acc, w) => acc + (Number(w.caloriesBurned) || 0), 0);
    }, [currentDayObj.workouts]);
    const targets = (0, import_react3.useMemo)(() => {
      const w = Number(profile.weight) || 70;
      const h = Number(profile.height) || 170;
      const a = Number(profile.age) || 25;
      let bmr = 10 * w + 6.25 * h - 5 * a;
      bmr += profile.gender === "male" ? 5 : -161;
      bmr = Math.round(bmr);
      const actObj = ACTIVITY_LEVELS.find((x) => x.id === profile.activity) || ACTIVITY_LEVELS[2];
      const tdee = Math.round(bmr * actObj.multiplier);
      const goalObj = GOAL_PRESETS.find((x) => x.id === profile.goal) || GOAL_PRESETS[2];
      const baseTargetCalories = profile.useCustomCalories ? Math.max(1e3, Number(profile.customCalories) || 2e3) : Math.max(1200, tdee + goalObj.calOffset);
      const workoutBonus = profile.eatBackWorkoutCalories ? totalBurnedCalories : 0;
      const netTargetCalories = baseTargetCalories + workoutBonus;
      const proteinG = Math.round(netTargetCalories * (profile.proteinPct / 100) / 4);
      const carbsG = Math.round(netTargetCalories * (profile.carbsPct / 100) / 4);
      const fatG = Math.round(netTargetCalories * (profile.fatPct / 100) / 9);
      const fiberG = Math.round(netTargetCalories / 1e3 * 14);
      const waterTargetMl = Math.round(w * 38 + totalBurnedCalories * 0.8);
      return {
        bmr,
        tdee,
        baseCalories: baseTargetCalories,
        workoutBonus,
        calories: netTargetCalories,
        protein: proteinG,
        carbs: carbsG,
        fat: fatG,
        fiber: fiberG,
        waterMl: waterTargetMl,
        goalLabel: goalObj.label
      };
    }, [profile, totalBurnedCalories]);
    const dailySummary = (0, import_react3.useMemo)(() => {
      const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      const byMeal = {
        Breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: [] },
        Lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: [] },
        Snack: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: [] },
        Dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: [] }
      };
      (currentDayObj.meals || []).forEach((entry) => {
        const food = foodDb.find((f2) => f2.id === entry.foodId);
        if (!food)
          return;
        const mult = Number(entry.servings) || 0;
        const p = +(food.protein * mult).toFixed(1);
        const c = +(food.carbs * mult).toFixed(1);
        const f = +(food.fat * mult).toFixed(1);
        const fib = +(food.fiber * mult).toFixed(1);
        const cal = Math.round((food.protein * 4 + food.carbs * 4 + food.fat * 9) * mult);
        totals.calories += cal;
        totals.protein = +(totals.protein + p).toFixed(1);
        totals.carbs = +(totals.carbs + c).toFixed(1);
        totals.fat = +(totals.fat + f).toFixed(1);
        totals.fiber = +(totals.fiber + fib).toFixed(1);
        const slot = byMeal[entry.meal] ? entry.meal : "Breakfast";
        byMeal[slot].calories += cal;
        byMeal[slot].protein = +(byMeal[slot].protein + p).toFixed(1);
        byMeal[slot].carbs = +(byMeal[slot].carbs + c).toFixed(1);
        byMeal[slot].fat = +(byMeal[slot].fat + f).toFixed(1);
        byMeal[slot].fiber = +(byMeal[slot].fiber + fib).toFixed(1);
        byMeal[slot].items.push(__spreadProps(__spreadValues({}, entry), {
          food,
          computed: { calories: cal, protein: p, carbs: c, fat: f, fiber: fib }
        }));
      });
      const totalMacroKcal = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;
      const actualSplit = totalMacroKcal > 0 ? {
        proteinPct: Math.round(totals.protein * 4 / totalMacroKcal * 100),
        carbsPct: Math.round(totals.carbs * 4 / totalMacroKcal * 100),
        fatPct: Math.round(totals.fat * 9 / totalMacroKcal * 100)
      } : { proteinPct: 0, carbsPct: 0, fatPct: 0 };
      return { totals, byMeal, actualSplit };
    }, [currentDayObj.meals, foodDb]);
    (0, import_react3.useEffect)(() => {
      const rem = targets.calories - dailySummary.totals.calories;
      document.title = rem >= 0 ? `(${rem} kcal left) NutriPulse Pro \u2014 Meal & Macro Planner` : `(${Math.abs(rem)} kcal over) NutriPulse Pro \u2014 Meal & Macro Planner`;
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = LOGO_DATA_URI;
    }, [targets.calories, dailySummary.totals.calories]);
    const aiRecommendations = (0, import_react3.useMemo)(() => {
      const remCal = targets.calories - dailySummary.totals.calories;
      const remP = +(targets.protein - dailySummary.totals.protein).toFixed(1);
      const remC = +(targets.carbs - dailySummary.totals.carbs).toFixed(1);
      const remF = +(targets.fat - dailySummary.totals.fat).toFixed(1);
      if (remCal <= 50 && remP <= 5) {
        return {
          status: "optimal",
          headline: "Daily Macro Targets Achieved!",
          advice: "You are within 50 kcal of your precision daily energy goal. Focus on hydration and recovery sleep.",
          suggestions: []
        };
      }
      if (remCal < -100) {
        return {
          status: "surplus",
          headline: `You are ${Math.abs(remCal)} kcal above today's target`,
          advice: "Consider logging a 25-minute brisk walk or scaling down a carb/fat serving in your dinner slot.",
          suggestions: []
        };
      }
      const candidates = foodDb.filter((f) => !vegOnly || f.veg).map((food) => {
        const foodCal = calcFoodCalories(food.protein, food.carbs, food.fat);
        let idealServings = 1;
        if (remP > 18 && food.protein >= 15) {
          idealServings = Math.min(2, Math.max(0.5, Math.round(remP / food.protein * 2) / 2));
        } else if (remC > 25 && food.carbs >= 20) {
          idealServings = Math.min(2, Math.max(0.5, Math.round(remC / food.carbs * 2) / 2));
        }
        const totalCal = Math.round(foodCal * idealServings);
        const totalP = +(food.protein * idealServings).toFixed(1);
        const totalC = +(food.carbs * idealServings).toFixed(1);
        const totalF = +(food.fat * idealServings).toFixed(1);
        const pScore = remP > 0 ? Math.min(totalP, remP) * 3.2 : -totalP;
        const cScore = remC > 0 ? Math.min(totalC, remC) * 1.4 : -totalC * 0.5;
        const fScore = remF > 0 ? Math.min(totalF, remF) * 1.2 : -totalF * 0.8;
        const calPenalty = totalCal > remCal + 120 ? -50 : 0;
        let reason = "Balanced macro booster";
        if (food.protein * 4 / Math.max(1, foodCal) > 0.55) {
          reason = `High-Purity Protein (+${totalP}g P) for lean synthesis`;
        } else if (food.fiber >= 4) {
          reason = `High-Satiety Complex Carb & Gut Fiber (+${food.fiber}g Fiber)`;
        } else if (food.fat >= 10) {
          reason = `Essential Healthy Fats (+${totalF}g F)`;
        }
        return {
          food,
          servings: idealServings,
          totalCal,
          totalP,
          totalC,
          totalF,
          reason,
          score: pScore + cScore + fScore + calPenalty
        };
      }).filter((item) => item.totalCal <= Math.max(250, remCal + 100)).sort((a, b) => b.score - a.score).slice(0, 4);
      return {
        status: "needs_macros",
        headline: `Remaining Gap: ${Math.max(0, remCal)} kcal \u2022 ${Math.max(0, remP)}g Protein \u2022 ${Math.max(0, remC)}g Carbs`,
        advice: remP > 25 ? `Prioritize lean protein density right now\u2014you need ${remP}g more protein to hit your ${targets.protein}g synthesis target.` : `You're on track! Top off your remaining ${Math.max(0, remCal)} kcal with any of these precision-matched foods:`,
        suggestions: candidates
      };
    }, [targets, dailySummary.totals, foodDb, vegOnly]);
    const fastingStatus = (0, import_react3.useMemo)(() => {
      const protocol = FASTING_PROTOCOLS.find((p) => p.id === profile.fastingProtocol) || FASTING_PROTOCOLS[0];
      const startHr = Number(profile.fastingStartHour) || 20;
      const endHr = (startHr + protocol.fastHours) % 24;
      const curHr = nowTime.getHours();
      const curMin = nowTime.getMinutes();
      const curSec = nowTime.getSeconds();
      const currentSecondsOfDay = curHr * 3600 + curMin * 60 + curSec;
      const startSecondsOfDay = startHr * 3600;
      let elapsedFastSec = currentSecondsOfDay - startSecondsOfDay;
      if (elapsedFastSec < 0)
        elapsedFastSec += 86400;
      const totalFastSec = protocol.fastHours * 3600;
      const isFasting = elapsedFastSec < totalFastSec;
      if (isFasting) {
        const remSec = totalFastSec - elapsedFastSec;
        const hrs = Math.floor(remSec / 3600);
        const mins = Math.floor(remSec % 3600 / 60);
        const secs = remSec % 60;
        const pct = Math.min(100, Math.round(elapsedFastSec / totalFastSec * 100));
        const elapsedHrs = elapsedFastSec / 3600;
        const zone = elapsedHrs >= 14 ? "Deep Fat Oxidation & Autophagy Zone" : elapsedHrs >= 10 ? "Glycogen Depletion & Lipolysis" : "Post-Absorptive Digestive Phase";
        return {
          isFasting: true,
          protocol,
          countdown: `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
          pct,
          zone,
          windowLabel: `Fasting Window until ${endHr > 12 ? `${endHr - 12}:00 PM` : `${endHr}:00 PM`}`
        };
      } else {
        const elapsedFeedSec = elapsedFastSec - totalFastSec;
        const totalFeedSec = protocol.feedHours * 3600;
        const remSec = Math.max(0, totalFeedSec - elapsedFeedSec);
        const hrs = Math.floor(remSec / 3600);
        const mins = Math.floor(remSec % 3600 / 60);
        const secs = remSec % 60;
        const pct = Math.min(100, Math.round(elapsedFeedSec / totalFeedSec * 100));
        return {
          isFasting: false,
          protocol,
          countdown: `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
          pct,
          zone: "Active Anabolic Feeding & Nutrient Partitioning Window",
          windowLabel: `Feeding Window closes at ${startHr > 12 ? `${startHr - 12}:00 PM` : `${startHr}:00`}`
        };
      }
    }, [nowTime, profile.fastingProtocol, profile.fastingStartHour]);
    const groceryList = (0, import_react3.useMemo)(() => {
      const map = {};
      (currentDayObj.meals || []).forEach((entry) => {
        const food = foodDb.find((f) => f.id === entry.foodId);
        if (!food)
          return;
        const aisle = food.aisle || food.category || "Pantry Staples";
        if (!map[aisle])
          map[aisle] = {};
        if (!map[aisle][food.id]) {
          map[aisle][food.id] = { food, totalServings: 0, mealsUsed: /* @__PURE__ */ new Set() };
        }
        map[aisle][food.id].totalServings = +(map[aisle][food.id].totalServings + Number(entry.servings)).toFixed(2);
        map[aisle][food.id].mealsUsed.add(entry.meal);
      });
      return map;
    }, [currentDayObj.meals, foodDb]);
    const filteredFoods = (0, import_react3.useMemo)(() => {
      return foodDb.filter((food) => {
        if (vegOnly && !food.veg)
          return false;
        if (selectedCategory !== "All" && food.category !== selectedCategory)
          return false;
        if (searchQuery.trim() !== "") {
          const q = searchQuery.toLowerCase();
          return food.name.toLowerCase().includes(q) || food.category.toLowerCase().includes(q);
        }
        return true;
      });
    }, [foodDb, vegOnly, selectedCategory, searchQuery]);
    const handleGoalSelect = (goalId) => {
      const preset = GOAL_PRESETS.find((g) => g.id === goalId);
      if (!preset)
        return;
      setProfile((prev) => __spreadProps(__spreadValues({}, prev), {
        goal: goalId,
        useCustomCalories: false,
        proteinPct: preset.p,
        carbsPct: preset.c,
        fatPct: preset.f
      }));
      triggerToast(`Applied "${preset.label}" macro ratio (${preset.p}/${preset.c}/${preset.f})`);
    };
    const handleMacroSlider = (macroKey, newVal) => {
      const val = Math.min(80, Math.max(5, Number(newVal)));
      setProfile((prev) => {
        const rem = 100 - val;
        if (macroKey === "proteinPct") {
          const otherTotal = prev.carbsPct + prev.fatPct;
          const c = otherTotal > 0 ? Math.round(prev.carbsPct / otherTotal * rem) : Math.round(rem / 2);
          const f = rem - c;
          return __spreadProps(__spreadValues({}, prev), { proteinPct: val, carbsPct: c, fatPct: f });
        } else if (macroKey === "carbsPct") {
          const otherTotal = prev.proteinPct + prev.fatPct;
          const p = otherTotal > 0 ? Math.round(prev.proteinPct / otherTotal * rem) : Math.round(rem / 2);
          const f = rem - p;
          return __spreadProps(__spreadValues({}, prev), { carbsPct: val, proteinPct: p, fatPct: f });
        } else {
          const otherTotal = prev.proteinPct + prev.carbsPct;
          const p = otherTotal > 0 ? Math.round(prev.proteinPct / otherTotal * rem) : Math.round(rem / 2);
          const c = rem - p;
          return __spreadProps(__spreadValues({}, prev), { fatPct: val, proteinPct: p, carbsPct: c });
        }
      });
    };
    const addFoodToMeal = (foodId, meal = activeMealSlot, servings = 1) => {
      const food = foodDb.find((f) => f.id === foodId);
      updateCurrentDay((day) => {
        const prevMeals = day.meals || [];
        const existingIndex = prevMeals.findIndex((item) => item.meal === meal && item.foodId === foodId);
        if (existingIndex > -1) {
          const updated = [...prevMeals];
          updated[existingIndex] = __spreadProps(__spreadValues({}, updated[existingIndex]), {
            servings: +(Number(updated[existingIndex].servings) + servings).toFixed(2)
          });
          return __spreadProps(__spreadValues({}, day), { meals: updated });
        }
        return __spreadProps(__spreadValues({}, day), {
          meals: [
            ...prevMeals,
            { id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, meal, foodId, servings }
          ]
        });
      });
      if (food) {
        triggerToast(`Added ${servings}x ${food.name} to ${meal}`);
      }
    };
    const updateEntryServings = (entryId, nextServings) => {
      const num = Math.max(0.25, Math.min(20, Number(nextServings) || 0.25));
      updateCurrentDay((day) => __spreadProps(__spreadValues({}, day), {
        meals: (day.meals || []).map((item) => item.id === entryId ? __spreadProps(__spreadValues({}, item), { servings: num }) : item)
      }));
    };
    const removeEntry = (entryId) => {
      updateCurrentDay((day) => __spreadProps(__spreadValues({}, day), {
        meals: (day.meals || []).filter((item) => item.id !== entryId)
      }));
    };
    const applyTemplate = (template) => {
      updateCurrentDay((day) => __spreadProps(__spreadValues({}, day), {
        meals: template.entries.map((e, idx) => __spreadProps(__spreadValues({}, e), {
          id: `tpl_${Date.now()}_${idx}`
        }))
      }));
      triggerToast(`Loaded "${template.title}" into ${selectedDate}!`);
    };
    const handleLogWorkout = (e) => {
      e.preventDefault();
      const wType = WORKOUT_TYPES.find((w) => w.id === workoutForm.typeId) || WORKOUT_TYPES[0];
      const mins = Math.max(5, Math.min(300, Number(workoutForm.minutes) || 30));
      const burned = Math.round(wType.met * (Number(profile.weight) || 72) * (mins / 60));
      const entry = {
        id: `wk_${Date.now()}`,
        typeId: wType.id,
        label: wType.label,
        icon: wType.icon,
        minutes: mins,
        caloriesBurned: burned
      };
      updateCurrentDay((day) => __spreadProps(__spreadValues({}, day), {
        workouts: [...day.workouts || [], entry]
      }));
      triggerToast(`Logged ${mins}m ${wType.label} (-${burned} kcal burned)`);
    };
    const removeWorkout = (wkId) => {
      updateCurrentDay((day) => __spreadProps(__spreadValues({}, day), {
        workouts: (day.workouts || []).filter((w) => w.id !== wkId)
      }));
    };
    const handleCreateCustomFood = (e) => {
      var _a2;
      e.preventDefault();
      if (!newFood.name.trim())
        return;
      const customItem = {
        id: `custom_${Date.now()}`,
        name: newFood.name.trim(),
        serving: newFood.serving.trim() || "1 serving (100g)",
        category: newFood.category,
        protein: Math.max(0, Number(newFood.protein) || 0),
        carbs: Math.max(0, Number(newFood.carbs) || 0),
        fat: Math.max(0, Number(newFood.fat) || 0),
        fiber: Math.max(0, Number(newFood.fiber) || 0),
        veg: newFood.veg,
        aisle: newFood.category,
        image: ((_a2 = newFood.image) == null ? void 0 : _a2.trim()) || FALLBACK_FOOD_IMAGE,
        isCustom: true
      };
      const updatedDb = [customItem, ...foodDb];
      setFoodDb(updatedDb);
      try {
        const customOnly = updatedDb.filter((f) => f.isCustom);
        localStorage.setItem(`nutripulse_custom_foods_v3_${activeUserId}`, JSON.stringify(customOnly));
      } catch (err) {
        console.error(err);
      }
      addFoodToMeal(customItem.id, activeMealSlot, 1);
      setNewFood({
        name: "",
        serving: "100g",
        category: "High Protein",
        protein: "",
        carbs: "",
        fat: "",
        fiber: "",
        veg: true,
        image: CUSTOM_FOOD_GALLERY[0].url
      });
      setShowCustomFoodModal(false);
    };
    const handleQuickAddMacroFood = (e) => {
      e.preventDefault();
      const customItem = {
        id: `quick_${Date.now()}`,
        name: quickMacro.name.trim() || "Quick Nutrition Entry",
        serving: "1 scanned serving",
        category: "High Protein",
        protein: Math.max(0, Number(quickMacro.protein) || 0),
        carbs: Math.max(0, Number(quickMacro.carbs) || 0),
        fat: Math.max(0, Number(quickMacro.fat) || 0),
        fiber: Math.max(0, Number(quickMacro.fiber) || 0),
        veg: quickMacro.veg,
        aisle: "Packaged & Scanned",
        image: CUSTOM_FOOD_GALLERY[3].url,
        isCustom: true
      };
      setFoodDb((prev) => [customItem, ...prev]);
      addFoodToMeal(customItem.id, activeMealSlot, 1);
      setShowQuickCalcModal(false);
    };
    const downloadBrandSvg = () => {
      const blob = new Blob([LOGO_SVG_RAW], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "NutriPulse-Pro-Official-Logo.svg";
      a.click();
      URL.revokeObjectURL(url);
      triggerToast("Downloaded NutriPulse-Pro-Official-Logo.svg!");
    };
    const calPct = Math.min(100, Math.round(dailySummary.totals.calories / Math.max(1, targets.calories) * 100));
    const calRemaining = targets.calories - dailySummary.totals.calories;
    const ringRadius = 68;
    const ringCircumference = 2 * Math.PI * ringRadius;
    const ringOffset = ringCircumference - calPct / 100 * ringCircumference;
    const waterMl = currentDayObj.waterMl || 0;
    const totalGlasses = Math.max(8, Math.ceil(targets.waterMl / 250));
    const drankGlasses = Math.floor(waterMl / 250);
    const handleDirectZipDownload = () => __async(this, null, function* () {
      const completeAppFile = `import React from 'react';
import { INITIAL_FOOD_DB, ACTIVITY_LEVELS, GOAL_PRESETS, WORKOUT_TYPES, FASTING_PROTOCOLS, SMART_TEMPLATES } from './data/foodDatabase.js';
import VegBadge from './components/VegBadge.jsx';
import FoodImage, { FALLBACK_FOOD_IMAGE } from './components/FoodImage.jsx';
import { calcFoodCalories } from './constants/nutritionConstants.js';
import { calculateClinicalTargets, checkBackendHealth } from './services/apiClient.js';

/**
 * NutriPulse Pro \u2014 Full-Stack Main Application Component
 * Note: For the single-file bundle, you can also paste your full App.jsx directly here.
 * \xA9 Ballapuram Prakash Royal. All Rights Reserved.
 */
${App.toString()}

export default App;
`;
      yield downloadFullStackRepoZip(completeAppFile, triggerToast, setZipBusy);
    });
    if (!currentUser) {
      return /* @__PURE__ */ import_react3.default.createElement("div", { className: "min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between relative overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-30 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-cyan-950/90 border-b border-emerald-500/40 px-4 py-2.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2 text-xs sm:text-sm text-emerald-200" }, /* @__PURE__ */ import_react3.default.createElement(FileJson, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ import_react3.default.createElement("span", null, /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-white" }, "GitHub & Vercel Ready (.ZIP):"), " Multi-file Frontend (", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-emerald-300" }, "/src"), ") + Serverless API (", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-cyan-300" }, "/api"), ") + Python FastAPI (", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-indigo-300" }, "/backend"), ")")), /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          type: "button",
          disabled: zipBusy,
          onClick: handleDirectZipDownload,
          className: "flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
        },
        /* @__PURE__ */ import_react3.default.createElement(Download, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ import_react3.default.createElement("span", null, zipBusy ? "Generating .ZIP..." : "Download Full-Stack Repo (.ZIP)")
      ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed inset-0 pointer-events-none z-0" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute top-1/3 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" })), toastMsg && /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md" }, /* @__PURE__ */ import_react3.default.createElement(Check, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-sm font-medium" }, toastMsg)), /* @__PURE__ */ import_react3.default.createElement("header", { className: "relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "md", showWordmark: true }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2 text-xs text-slate-400" }, /* @__PURE__ */ import_react3.default.createElement(ShieldCheck, { className: "w-4 h-4 text-emerald-400" }), /* @__PURE__ */ import_react3.default.createElement("span", null, "Personal Meal & Biometric Activity Tracker"))), /* @__PURE__ */ import_react3.default.createElement("main", { className: "relative z-10 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-6 space-y-6" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider" }, /* @__PURE__ */ import_react3.default.createElement(Sparkles, { className: "w-3.5 h-3.5" }), " Individual Meal & Macro Cloud Workspace"), /* @__PURE__ */ import_react3.default.createElement("h1", { className: "text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight" }, "Track Your Personal", " ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent" }, "Calories, Protein & Daily Meals")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-sm sm:text-base text-slate-300 leading-relaxed" }, "Create your personal NutriPulse Pro account to unlock individualized BMR/TDEE calculations, 7-day meal activity logs, custom recipes, workout calorie compensation, and live Intermittent Fasting schedules."), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-2 rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0" }, /* @__PURE__ */ import_react3.default.createElement(Target, { className: "w-5 h-5" })), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-sm font-bold text-white" }, "Personal TDEE & Macros"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "Tailored to your exact weight, height, age, and fitness goal."))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-2 rounded-xl bg-indigo-500/15 text-indigo-400 shrink-0" }, /* @__PURE__ */ import_react3.default.createElement(Calendar, { className: "w-5 h-5" })), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-sm font-bold text-white" }, "Isolated 7-Day Meal Logs"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "Every user gets their own private meal diary, hydration, and workout log.")))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(Users, { className: "w-4 h-4" }), " Instant 1-Click Demo Accounts"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] text-slate-400" }, "Test multi-user isolation")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5" }, usersDb.slice(0, 3).map((u) => {
        var _a2, _b, _c;
        return /* @__PURE__ */ import_react3.default.createElement(
          "button",
          {
            key: u.id,
            type: "button",
            onClick: () => handleQuickDemoLogin(u),
            className: "flex items-center justify-between p-3 rounded-xl bg-slate-950/90 hover:bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-left transition-all group"
          },
          /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: `w-9 h-9 rounded-xl bg-gradient-to-br ${u.avatarColor || "from-emerald-500 to-cyan-500"} flex items-center justify-center text-slate-950 font-black text-sm shrink-0` }, u.name.charAt(0).toUpperCase()), /* @__PURE__ */ import_react3.default.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs font-bold text-white truncate group-hover:text-emerald-300" }, u.name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[10px] text-slate-400 truncate" }, (_a2 = u.profile) == null ? void 0 : _a2.weight, "kg \u2022 ", (_c = (_b = u.profile) == null ? void 0 : _b.goal) == null ? void 0 : _c.toUpperCase()))),
          /* @__PURE__ */ import_react3.default.createElement(ChevronRight, { className: "w-4 h-4 text-slate-500 group-hover:text-emerald-400 shrink-0" })
        );
      })))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-6" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            setAuthMode("login");
            setAuthError("");
          },
          className: `flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${authMode === "login" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"}`
        },
        /* @__PURE__ */ import_react3.default.createElement(LogIn, { className: "w-4 h-4" }),
        /* @__PURE__ */ import_react3.default.createElement("span", null, "Sign In")
      ), /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            setAuthMode("register");
            setAuthError("");
          },
          className: `flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${authMode === "register" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-white"}`
        },
        /* @__PURE__ */ import_react3.default.createElement(UserPlus, { className: "w-4 h-4" }),
        /* @__PURE__ */ import_react3.default.createElement("span", null, "Create Account")
      )), authError && /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-medium flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement(Info, { className: "w-4 h-4 text-rose-400 shrink-0" }), /* @__PURE__ */ import_react3.default.createElement("span", null, authError)), authMode === "login" ? /* @__PURE__ */ import_react3.default.createElement("form", { onSubmit: handleLoginSubmit, className: "space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs font-semibold text-slate-300 mb-1.5" }, "Email Address"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react3.default.createElement(Mail, { className: "w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "email",
          required: true,
          placeholder: "arjun@nutripulse.in",
          value: authForm.email,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { email: e.target.value })),
          className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
        }
      ))), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs font-semibold text-slate-300 mb-1.5" }, "Password"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react3.default.createElement(Lock, { className: "w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "password",
          required: true,
          placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
          value: authForm.password,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { password: e.target.value })),
          className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none"
        }
      ))), /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          type: "submit",
          className: "w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        },
        /* @__PURE__ */ import_react3.default.createElement(LogIn, { className: "w-4 h-4" }),
        /* @__PURE__ */ import_react3.default.createElement("span", null, "Sign In to My Meal Planner")
      ), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-center text-slate-400 pt-2" }, "New to NutriPulse Pro?", " ", /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            setAuthMode("register");
            setAuthError("");
          },
          className: "text-emerald-400 font-bold hover:underline"
        },
        "Register a new account"
      ))) : /* @__PURE__ */ import_react3.default.createElement("form", { onSubmit: handleRegisterSubmit, className: "space-y-3.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs font-semibold text-slate-300 mb-1" }, "Full Name *"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react3.default.createElement(User, { className: "w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "text",
          required: true,
          placeholder: "e.g., Kiran Kumar",
          value: authForm.name,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { name: e.target.value })),
          className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
        }
      ))), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs font-semibold text-slate-300 mb-1" }, "Email Address *"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react3.default.createElement(Mail, { className: "w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "email",
          required: true,
          placeholder: "kiran@example.com",
          value: authForm.email,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { email: e.target.value })),
          className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none"
        }
      )))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs font-semibold text-slate-300 mb-1" }, "Password *"), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "password",
          required: true,
          placeholder: "Min 6 characters",
          value: authForm.password,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { password: e.target.value })),
          className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
        }
      )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs font-semibold text-slate-300 mb-1" }, "Confirm Password *"), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "password",
          required: true,
          placeholder: "Repeat password",
          value: authForm.confirmPassword,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { confirmPassword: e.target.value })),
          className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
        }
      ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "pt-2 border-t border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] font-bold uppercase tracking-wider text-emerald-400 block mb-2" }, "Your Biometrics (For Instant TDEE Calculation)"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[10px] uppercase text-slate-400" }, "Gender"), /* @__PURE__ */ import_react3.default.createElement(
        "select",
        {
          value: authForm.gender,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { gender: e.target.value })),
          className: "w-full bg-transparent text-xs font-bold text-white focus:outline-none mt-0.5"
        },
        /* @__PURE__ */ import_react3.default.createElement("option", { value: "male", className: "bg-slate-900" }, "Male"),
        /* @__PURE__ */ import_react3.default.createElement("option", { value: "female", className: "bg-slate-900" }, "Female")
      )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[10px] uppercase text-slate-400" }, "Weight (kg)"), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "number",
          min: "30",
          max: "250",
          value: authForm.weight,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { weight: e.target.value })),
          className: "w-full bg-transparent text-xs font-bold text-emerald-400 focus:outline-none mt-0.5"
        }
      )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[10px] uppercase text-slate-400" }, "Height (cm)"), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "number",
          min: "120",
          max: "230",
          value: authForm.height,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { height: e.target.value })),
          className: "w-full bg-transparent text-xs font-bold text-indigo-400 focus:outline-none mt-0.5"
        }
      )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[10px] uppercase text-slate-400" }, "Age (yrs)"), /* @__PURE__ */ import_react3.default.createElement(
        "input",
        {
          type: "number",
          min: "14",
          max: "100",
          value: authForm.age,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { age: e.target.value })),
          className: "w-full bg-transparent text-xs font-bold text-amber-400 focus:outline-none mt-0.5"
        }
      ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[10px] uppercase text-slate-400" }, "Activity Level"), /* @__PURE__ */ import_react3.default.createElement(
        "select",
        {
          value: authForm.activity,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { activity: e.target.value })),
          className: "w-full bg-transparent text-xs font-bold text-white focus:outline-none mt-0.5"
        },
        ACTIVITY_LEVELS.map((a) => /* @__PURE__ */ import_react3.default.createElement("option", { key: a.id, value: a.id, className: "bg-slate-900" }, a.label, " (", a.multiplier, "x)"))
      )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[10px] uppercase text-slate-400" }, "Primary Goal"), /* @__PURE__ */ import_react3.default.createElement(
        "select",
        {
          value: authForm.goal,
          onChange: (e) => setAuthForm(__spreadProps(__spreadValues({}, authForm), { goal: e.target.value })),
          className: "w-full bg-transparent text-xs font-bold text-emerald-400 focus:outline-none mt-0.5"
        },
        GOAL_PRESETS.map((g) => /* @__PURE__ */ import_react3.default.createElement("option", { key: g.id, value: g.id, className: "bg-slate-900" }, g.label, " (", g.badge, ")"))
      )))), /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          type: "submit",
          className: "w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
        },
        /* @__PURE__ */ import_react3.default.createElement(UserPlus, { className: "w-4 h-4" }),
        /* @__PURE__ */ import_react3.default.createElement("span", null, "Create My Personal Account")
      ))))), /* @__PURE__ */ import_react3.default.createElement("footer", { className: "relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 text-center space-y-1 border-t border-slate-900/80" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 font-medium" }, "\xA9 ", (/* @__PURE__ */ new Date()).getFullYear(), " ", /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-emerald-400 font-bold" }, "Ballapuram Prakash Royal"), ". All Rights Reserved."), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-500" }, "Protected under the Indian Copyright Act, 1957 & International Copyright Laws. NutriPulse Pro \u2022 Multi-User Personal Meal & Macro Tracking System.")));
    }
    return /* @__PURE__ */ import_react3.default.createElement("div", { className: "min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 pb-16" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed inset-0 pointer-events-none overflow-hidden z-0" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" })), toastMsg && /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md animate-bounce" }, /* @__PURE__ */ import_react3.default.createElement(Check, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-sm font-medium" }, toastMsg)), /* @__PURE__ */ import_react3.default.createElement("header", { className: "sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-cyan-950/80 border-b border-emerald-500/30 px-4 py-2" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2 text-xs text-slate-200" }, /* @__PURE__ */ import_react3.default.createElement(FileJson, { className: "w-4 h-4 text-emerald-400 shrink-0" }), /* @__PURE__ */ import_react3.default.createElement("span", null, /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-emerald-300" }, "Ready for GitHub & Vercel:"), " Complete Frontend (", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-emerald-300" }, "/src"), ") + Backend (", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-cyan-300" }, "/api"), " & ", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-indigo-300" }, "/backend"), ")")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowGithubModal(true),
        className: "px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
      },
      "View Folder Structure"
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        disabled: zipBusy,
        onClick: handleDirectZipDownload,
        className: "flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
      },
      /* @__PURE__ */ import_react3.default.createElement(Download, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, zipBusy ? "Bundling .ZIP..." : "Download .ZIP Now")
    )))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3" }, /* @__PURE__ */ import_react3.default.createElement(
      NutriPulseLogo,
      {
        size: "md",
        showWordmark: true,
        interactive: true,
        onClick: () => setShowBrandModal(true)
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setActiveWorkspaceTab("workout_fasting"),
        className: "hidden xl:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs transition-all",
        title: "Click to manage Intermittent Fasting schedule"
      },
      /* @__PURE__ */ import_react3.default.createElement("span", { className: `w-2 h-2 rounded-full ${fastingStatus.isFasting ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-pulse"}` }),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-300 font-semibold" }, fastingStatus.protocol.id),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-mono font-bold text-cyan-300" }, fastingStatus.countdown),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400" }, fastingStatus.isFasting ? "Fasting" : "Feeding")
    ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2 sm:gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowProfileDrawer(!showProfileDrawer),
        className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all border ${showProfileDrawer ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50" : "bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800"}`
      },
      /* @__PURE__ */ import_react3.default.createElement(SlidersVertical, { className: "w-4 h-4 text-emerald-400" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "TDEE & Goals"),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "hidden md:inline-block px-2 py-0.5 bg-slate-950/80 rounded-md text-emerald-400 font-semibold" }, targets.calories, " kcal")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowQuickCalcModal(true),
        className: "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 transition-all",
        title: "Instant Label Macro Calculator"
      },
      /* @__PURE__ */ import_react3.default.createElement(Calculator, { className: "w-4 h-4 text-cyan-400" }),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "hidden sm:inline" }, "Quick Macro")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowCustomFoodModal(true),
        className: "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all"
      },
      /* @__PURE__ */ import_react3.default.createElement(CirclePlus, { className: "w-4 h-4 text-indigo-400" }),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "hidden sm:inline" }, "Custom Dish")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowExportModal(true),
        className: "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all",
        title: "Export or Print Daily Nutrition Report"
      },
      /* @__PURE__ */ import_react3.default.createElement(Download, { className: "w-4 h-4 text-slate-400" }),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "hidden md:inline" }, "Report")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowGithubModal(true),
        className: "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all",
        title: "Download GitHub & Vercel Ready Full-Stack Project (.zip)"
      },
      /* @__PURE__ */ import_react3.default.createElement(FileJson, { className: "w-4 h-4 text-emerald-400" }),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "hidden lg:inline" }, "GitHub .ZIP")
    ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowAccountMenu(!showAccountMenu),
        className: "flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all",
        title: "Manage Account or Switch User"
      },
      /* @__PURE__ */ import_react3.default.createElement("div", { className: `w-7 h-7 rounded-lg bg-gradient-to-br ${currentUser.avatarColor || "from-emerald-500 to-cyan-500"} flex items-center justify-center text-slate-950 font-black text-xs` }, currentUser.name.charAt(0).toUpperCase()),
      /* @__PURE__ */ import_react3.default.createElement("div", { className: "text-left hidden sm:block" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-white block leading-none" }, currentUser.name.split(" ")[0]), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] text-emerald-400 font-medium" }, profile.weight, "kg \u2022 Active"))
    ), showAccountMenu && /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 space-y-2.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "px-2 py-1.5 border-b border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs font-bold text-white truncate" }, currentUser.name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-400 truncate" }, currentUser.email)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 block" }, "Switch User Account"), usersDb.map((u) => /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: u.id,
        type: "button",
        onClick: () => {
          setCurrentUser(u);
          setShowAccountMenu(false);
          triggerToast(`Switched to ${u.name}'s meal log`);
        },
        className: `w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${u.id === currentUser.id ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-300 hover:bg-slate-800"}`
      },
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "truncate" }, u.name),
      u.id === currentUser.id && /* @__PURE__ */ import_react3.default.createElement(Check, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0" })
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "pt-1 border-t border-slate-800 flex flex-col gap-1" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setShowAccountMenu(false);
          setShowProfileDrawer(true);
        },
        className: "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800"
      },
      /* @__PURE__ */ import_react3.default.createElement(SlidersVertical, { className: "w-3.5 h-3.5 text-emerald-400" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Edit My Biometrics & TDEE")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        onClick: handleLogout,
        className: "w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/15 font-semibold"
      },
      /* @__PURE__ */ import_react3.default.createElement(LogOut, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Sign Out / Register New User")
    )))))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "border-t border-slate-800/60 bg-slate-950/60" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-1.5 text-xs text-slate-400 shrink-0 mr-2" }, /* @__PURE__ */ import_react3.default.createElement(Calendar, { className: "w-3.5 h-3.5 text-emerald-400" }), /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-semibold hidden sm:inline" }, "7-Day Log:")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-1.5 flex-1 justify-start sm:justify-center" }, sevenDays.map((d) => {
      var _a2;
      const isSelected = d.iso === selectedDate;
      const dayMeals = ((_a2 = daysData[d.iso]) == null ? void 0 : _a2.meals) || [];
      const dayCal = dayMeals.reduce((sum, entry) => {
        const f = foodDb.find((x) => x.id === entry.foodId);
        return f ? sum + Math.round(calcFoodCalories(f.protein, f.carbs, f.fat) * Number(entry.servings)) : sum;
      }, 0);
      return /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          key: d.iso,
          onClick: () => setSelectedDate(d.iso),
          className: `px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-2 border shrink-0 ${isSelected ? "bg-emerald-500/20 border-emerald-500/60 text-white shadow-sm shadow-emerald-500/10" : "bg-slate-900/70 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700"}`
        },
        /* @__PURE__ */ import_react3.default.createElement("div", { className: "text-left" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: `font-bold block leading-tight ${isSelected ? "text-emerald-300" : "text-slate-300"}` }, d.dayName), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] text-slate-500" }, d.monthDay)),
        /* @__PURE__ */ import_react3.default.createElement("span", { className: `text-[10px] font-mono px-1.5 py-0.5 rounded ${dayCal > 0 ? "bg-slate-950 text-emerald-400" : "bg-slate-950/50 text-slate-600"}` }, dayCal > 0 ? `${dayCal}` : "0", " kcal")
      );
    }))))), /* @__PURE__ */ import_react3.default.createElement("main", { className: "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6" }, /* @__PURE__ */ import_react3.default.createElement("section", { className: "relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: HERO_BANNER_IMAGE, alt: "Healthy Meal Prep Banner", className: "w-full h-full" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/40" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "max-w-2xl space-y-3.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        onClick: () => setShowBrandModal(true),
        className: "inline-flex items-center gap-2 pr-3 pl-1.5 py-1 rounded-full bg-slate-950/90 border border-emerald-500/40 backdrop-blur-md cursor-pointer hover:border-emerald-400 transition-all"
      },
      /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "xs" }),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-extrabold tracking-wider text-emerald-300" }, "NUTRIPULSE PRO AI")
    ), /* @__PURE__ */ import_react3.default.createElement("span", { className: "inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md" }, /* @__PURE__ */ import_react3.default.createElement(Sparkles, { className: "w-3.5 h-3.5" }), " ", targets.goalLabel), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-medium px-3 py-1 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700/80 backdrop-blur-md" }, profile.weight, " kg \u2022 ", profile.height, " cm \u2022 TDEE ", targets.tdee, " kcal"), totalBurnedCalories > 0 && /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1" }, /* @__PURE__ */ import_react3.default.createElement(Flame, { className: "w-3.5 h-3.5" }), " +", totalBurnedCalories, " kcal Active Burn")), /* @__PURE__ */ import_react3.default.createElement("h2", { className: "text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight" }, currentUser.name.split(" ")[0], "'s Precision Macro & Daily Meal Planner"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-sm text-slate-300 leading-relaxed" }, "Powered by the clinical Mifflin-St Jeor TDEE formula and Atwater energy system (", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-indigo-300 font-semibold" }, "4 kcal/g Protein"), ",", " ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-amber-300 font-semibold" }, "4 kcal/g Carbs"), ",", " ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-rose-300 font-semibold" }, "9 kcal/g Fat"), "). Switch between the Meal Planner, AI Nutritionist Gap Coach, Workout & Fasting Timer, and Smart Grocery List below.")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 min-w-[140px]" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] uppercase tracking-wider text-emerald-400 font-semibold block" }, "Net Calories"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xl font-black text-white" }, dailySummary.totals.calories), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400 block" }, "/ ", targets.calories, " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 min-w-[140px]" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] uppercase tracking-wider text-indigo-400 font-semibold block" }, "Protein"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xl font-black text-white" }, dailySummary.totals.protein, "g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400 block" }, "/ ", targets.protein, "g (", profile.proteinPct, "%)")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 min-w-[140px]" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] uppercase tracking-wider text-amber-400 font-semibold block" }, "Carbs"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xl font-black text-white" }, dailySummary.totals.carbs, "g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400 block" }, "/ ", targets.carbs, "g (", profile.carbsPct, "%)")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/80 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3.5 min-w-[140px]" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] uppercase tracking-wider text-rose-400 font-semibold block" }, "Dietary Fat"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xl font-black text-white" }, dailySummary.totals.fat, "g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400 block" }, "/ ", targets.fat, "g (", profile.fatPct, "%)"))))), showProfileDrawer && /* @__PURE__ */ import_react3.default.createElement("section", { className: "bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-all" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between pb-4 mb-5 border-b border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "sm" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", { className: "text-base sm:text-lg font-bold text-white" }, "Biometric BMR / TDEE Calculator & Macro Split Engine"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, "Mifflin-St Jeor clinical formula & Atwater calorie equivalents (4P / 4C / 9F)"))), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowProfileDrawer(false),
        className: "p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white"
      },
      /* @__PURE__ */ import_react3.default.createElement(X, { className: "w-4 h-4" })
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-5 space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/70 border border-slate-800/90 rounded-xl p-3" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase tracking-wider text-slate-400 mb-1" }, "Gender"), /* @__PURE__ */ import_react3.default.createElement(
      "select",
      {
        value: profile.gender,
        onChange: (e) => setProfile(__spreadProps(__spreadValues({}, profile), { gender: e.target.value })),
        className: "w-full bg-transparent text-sm font-semibold text-white focus:outline-none"
      },
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "male", className: "bg-slate-900" }, "Male (+5)"),
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "female", className: "bg-slate-900" }, "Female (-161)")
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/70 border border-slate-800/90 rounded-xl p-3" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase tracking-wider text-slate-400 mb-1" }, "Weight (kg)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        min: "30",
        max: "250",
        value: profile.weight,
        onChange: (e) => setProfile(__spreadProps(__spreadValues({}, profile), { weight: Number(e.target.value) })),
        className: "w-full bg-transparent text-sm font-bold text-emerald-400 focus:outline-none"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/70 border border-slate-800/90 rounded-xl p-3" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase tracking-wider text-slate-400 mb-1" }, "Height (cm)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        min: "120",
        max: "230",
        value: profile.height,
        onChange: (e) => setProfile(__spreadProps(__spreadValues({}, profile), { height: Number(e.target.value) })),
        className: "w-full bg-transparent text-sm font-bold text-indigo-400 focus:outline-none"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/70 border border-slate-800/90 rounded-xl p-3" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase tracking-wider text-slate-400 mb-1" }, "Age (yrs)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        min: "14",
        max: "100",
        value: profile.age,
        onChange: (e) => setProfile(__spreadProps(__spreadValues({}, profile), { age: Number(e.target.value) })),
        className: "w-full bg-transparent text-sm font-bold text-amber-400 focus:outline-none"
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2" }, "Activity Multiplier"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2" }, ACTIVITY_LEVELS.map((act) => /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: act.id,
        type: "button",
        onClick: () => setProfile(__spreadProps(__spreadValues({}, profile), { activity: act.id })),
        className: `text-left p-2.5 rounded-xl border transition-all ${profile.activity === act.id ? "bg-emerald-500/15 border-emerald-500/50 text-white" : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700"}`
      },
      /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-semibold text-slate-200" }, act.label), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] font-mono text-emerald-400" }, act.multiplier, "x")),
      /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-400 truncate mt-0.5" }, act.desc)
    )))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-3 gap-2.5 pt-1" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] text-slate-400 block" }, "Resting BMR"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-base font-extrabold text-slate-200" }, targets.bmr, " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-center" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] text-slate-400 block" }, "Maintenance TDEE"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-base font-extrabold text-indigo-400" }, targets.tdee, " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-center" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] text-emerald-300/80 block" }, "Net Goal"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-base font-extrabold text-emerald-400" }, targets.calories, " kcal")))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-7 space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-2 mb-2" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400" }, "Select Fitness Goal Preset"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "flex items-center gap-1.5 text-xs text-emerald-300 cursor-pointer" }, /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: profile.eatBackWorkoutCalories,
        onChange: (e) => setProfile(__spreadProps(__spreadValues({}, profile), { eatBackWorkoutCalories: e.target.checked })),
        className: "rounded accent-emerald-500"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("span", null, "Eat Back Workout Burn (+", totalBurnedCalories, " kcal)")), /* @__PURE__ */ import_react3.default.createElement("label", { className: "flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer" }, /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: profile.useCustomCalories,
        onChange: (e) => setProfile(__spreadProps(__spreadValues({}, profile), { useCustomCalories: e.target.checked })),
        className: "rounded accent-emerald-500"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("span", null, "Custom kcal")))), profile.useCustomCalories ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3 bg-slate-950/80 border border-emerald-500/40 rounded-xl p-3 mb-3" }, /* @__PURE__ */ import_react3.default.createElement(Flame, { className: "w-5 h-5 text-emerald-400 shrink-0" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex-1" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-300 block" }, "Custom Base Daily Calorie Target (kcal)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        min: "1000",
        max: "6000",
        step: "50",
        value: profile.customCalories,
        onChange: (e) => setProfile(__spreadProps(__spreadValues({}, profile), { customCalories: Number(e.target.value) })),
        className: "mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm font-bold text-emerald-400 w-40 focus:outline-none"
      }
    ))) : /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2" }, GOAL_PRESETS.map((g) => /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: g.id,
        type: "button",
        onClick: () => handleGoalSelect(g.id),
        className: `p-2.5 rounded-xl border text-left transition-all ${profile.goal === g.id ? "bg-indigo-500/20 border-indigo-500/60 text-white" : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"}`
      },
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-indigo-300 block w-fit mb-1" }, g.badge),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-semibold text-slate-200 block leading-tight" }, g.label),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] text-slate-400 mt-1 block" }, g.p, "P / ", g.c, "C / ", g.f, "F %")
    )))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-semibold uppercase tracking-wider text-slate-400" }, "Macro Ratio Split (Auto-Balances to 100%)"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-mono text-emerald-400" }, profile.proteinPct + profile.carbsPct + profile.fatPct, "% Total")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-between text-xs" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-semibold text-indigo-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(Beef, { className: "w-3.5 h-3.5" }), " Protein (", profile.proteinPct, "%) \u2022 4 kcal/g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-bold text-white" }, targets.protein, "g / day")), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "range",
        min: "10",
        max: "60",
        value: profile.proteinPct,
        onChange: (e) => handleMacroSlider("proteinPct", e.target.value),
        className: "w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-between text-xs" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-semibold text-amber-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(Wheat, { className: "w-3.5 h-3.5" }), " Carbohydrates (", profile.carbsPct, "%) \u2022 4 kcal/g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-bold text-white" }, targets.carbs, "g / day")), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "range",
        min: "5",
        max: "70",
        value: profile.carbsPct,
        onChange: (e) => handleMacroSlider("carbsPct", e.target.value),
        className: "w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-between text-xs" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-semibold text-rose-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(Droplets, { className: "w-3.5 h-3.5" }), " Dietary Fat (", profile.fatPct, "%) \u2022 9 kcal/g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-bold text-white" }, targets.fat, "g / day")), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "range",
        min: "10",
        max: "75",
        value: profile.fatPct,
        onChange: (e) => handleMacroSlider("fatPct", e.target.value),
        className: "w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
      }
    )))))), /* @__PURE__ */ import_react3.default.createElement("section", { className: "grid grid-cols-1 lg:grid-cols-12 gap-5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-4 bg-slate-900/85 border border-slate-800/90 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(Target, { className: "w-3.5 h-3.5" }), " Daily Energy Budget"), /* @__PURE__ */ import_react3.default.createElement("h2", { className: "text-lg font-bold text-white mt-0.5" }, "Calorie Balance")), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowProfileDrawer(!showProfileDrawer),
        className: "text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors"
      },
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Edit Target"),
      /* @__PURE__ */ import_react3.default.createElement(ChevronRight, { className: "w-3.5 h-3.5" })
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-center gap-6 my-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative w-40 h-40 flex items-center justify-center shrink-0" }, /* @__PURE__ */ import_react3.default.createElement("svg", { className: "w-full h-full -rotate-90 transform", viewBox: "0 0 160 160" }, /* @__PURE__ */ import_react3.default.createElement(
      "circle",
      {
        cx: "80",
        cy: "80",
        r: ringRadius,
        className: "stroke-slate-800",
        strokeWidth: "12",
        fill: "transparent"
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      "circle",
      {
        cx: "80",
        cy: "80",
        r: ringRadius,
        stroke: calRemaining < 0 ? "#f43f5e" : "#10b981",
        strokeWidth: "12",
        strokeDasharray: ringCircumference,
        strokeDashoffset: ringOffset,
        strokeLinecap: "round",
        fill: "transparent",
        className: "transition-all duration-700 ease-out"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-center" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-2xl font-extrabold text-white tracking-tight" }, dailySummary.totals.calories), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] text-slate-400 font-medium" }, "of ", targets.calories, " kcal"), /* @__PURE__ */ import_react3.default.createElement("span", { className: `mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${calRemaining >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/20 text-rose-400"}` }, calRemaining >= 0 ? `${calRemaining} left` : `${Math.abs(calRemaining)} over`))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "space-y-2 text-xs flex-1" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-400 block text-[11px]" }, "Base Target + Exercise"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-bold text-slate-200" }, targets.baseCalories, " + ", targets.workoutBonus, " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-400 block text-[11px]" }, "Actual Macro Split"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-bold text-emerald-400" }, dailySummary.actualSplit.proteinPct, "% P \u2022 ", dailySummary.actualSplit.carbsPct, "% C \u2022 ", dailySummary.actualSplit.fatPct, "% F")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/70 border border-slate-800/80 rounded-xl p-2.5" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-400 block text-[11px]" }, "Target Macro Split"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-bold text-slate-300" }, profile.proteinPct, "% P \u2022 ", profile.carbsPct, "% C \u2022 ", profile.fatPct, "% F")))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "pt-3 border-t border-slate-800/80" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-between text-[11px] text-slate-400 mb-1.5" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "Meal Calorie Distribution"), /* @__PURE__ */ import_react3.default.createElement("span", null, calPct, "% of daily goal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-4 gap-1.5 text-center" }, MEAL_SLOTS.map((slot) => {
      var _a2;
      const mealCal = ((_a2 = dailySummary.byMeal[slot.id]) == null ? void 0 : _a2.calories) || 0;
      return /* @__PURE__ */ import_react3.default.createElement("div", { key: slot.id, className: "bg-slate-950/80 rounded-lg p-1.5 border border-slate-800/60" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] text-slate-400 block truncate" }, slot.label), /* @__PURE__ */ import_react3.default.createElement("span", { className: `text-xs font-bold ${slot.color}` }, mealCal));
    })))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative bg-slate-900/85 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute right-0 top-0 w-28 h-28 opacity-15 pointer-events-none rounded-bl-full overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=400&q=80", alt: "Protein", className: "w-full h-full" })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(
      FoodImage,
      {
        src: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=200&q=80",
        alt: "Protein source",
        className: "w-10 h-10 rounded-xl border border-indigo-500/40 shrink-0"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-sm font-bold text-white" }, "Protein"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-400" }, "Muscle Synthesis \u2022 4 kcal/g"))), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20" }, Math.round(dailySummary.totals.protein * 4), " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "mt-4 flex items-baseline justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-2xl font-extrabold text-white" }, dailySummary.totals.protein, "g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400 ml-1.5" }, "/ ", targets.protein, "g target")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-indigo-400" }, Math.round(dailySummary.totals.protein / Math.max(1, targets.protein) * 100), "%")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mt-2 border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-500",
        style: { width: `${Math.min(100, dailySummary.totals.protein / Math.max(1, targets.protein) * 100)}%` }
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10 mt-3 pt-2.5 border-t border-slate-800/70 flex justify-between text-xs text-slate-400" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "Per kg bodyweight: ", /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-slate-200" }, (dailySummary.totals.protein / Math.max(1, profile.weight)).toFixed(1), "g/kg")), /* @__PURE__ */ import_react3.default.createElement("span", null, targets.protein - dailySummary.totals.protein > 0 ? `${(targets.protein - dailySummary.totals.protein).toFixed(1)}g to go` : "Target Hit!"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative bg-slate-900/85 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute right-0 top-0 w-28 h-28 opacity-15 pointer-events-none rounded-bl-full overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=400&q=80", alt: "Carbs", className: "w-full h-full" })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(
      FoodImage,
      {
        src: "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=200&q=80",
        alt: "Carbohydrates source",
        className: "w-10 h-10 rounded-xl border border-amber-500/40 shrink-0"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-sm font-bold text-white" }, "Carbohydrates"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-400" }, "Glycogen & Energy \u2022 4 kcal/g"))), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20" }, Math.round(dailySummary.totals.carbs * 4), " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "mt-4 flex items-baseline justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-2xl font-extrabold text-white" }, dailySummary.totals.carbs, "g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400 ml-1.5" }, "/ ", targets.carbs, "g target")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-amber-400" }, Math.round(dailySummary.totals.carbs / Math.max(1, targets.carbs) * 100), "%")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mt-2 border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500",
        style: { width: `${Math.min(100, dailySummary.totals.carbs / Math.max(1, targets.carbs) * 100)}%` }
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10 mt-3 pt-2.5 border-t border-slate-800/70 flex justify-between text-xs text-slate-400" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "Net Carbs: ", /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-slate-200" }, Math.max(0, +(dailySummary.totals.carbs - dailySummary.totals.fiber).toFixed(1)), "g")), /* @__PURE__ */ import_react3.default.createElement("span", null, targets.carbs - dailySummary.totals.carbs > 0 ? `${(targets.carbs - dailySummary.totals.carbs).toFixed(1)}g remaining` : "Target Hit!"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative bg-slate-900/85 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute right-0 top-0 w-28 h-28 opacity-15 pointer-events-none rounded-bl-full overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80", alt: "Healthy Fats", className: "w-full h-full" })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(
      FoodImage,
      {
        src: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=200&q=80",
        alt: "Dietary fat source",
        className: "w-10 h-10 rounded-xl border border-rose-500/40 shrink-0"
      }
    ), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-sm font-bold text-white" }, "Dietary Fats"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-400" }, "Hormones & Absorption \u2022 9 kcal/g"))), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/20" }, Math.round(dailySummary.totals.fat * 9), " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "mt-4 flex items-baseline justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-2xl font-extrabold text-white" }, dailySummary.totals.fat, "g"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400 ml-1.5" }, "/ ", targets.fat, "g target")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-rose-400" }, Math.round(dailySummary.totals.fat / Math.max(1, targets.fat) * 100), "%")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mt-2 border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-500",
        style: { width: `${Math.min(100, dailySummary.totals.fat / Math.max(1, targets.fat) * 100)}%` }
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10 mt-3 pt-2.5 border-t border-slate-800/70 flex justify-between text-xs text-slate-400" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "Caloric Share: ", /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-slate-200" }, dailySummary.actualSplit.fatPct, "%")), /* @__PURE__ */ import_react3.default.createElement("span", null, targets.fat - dailySummary.totals.fat > 0 ? `${(targets.fat - dailySummary.totals.fat).toFixed(1)}g remaining` : "Target Hit!"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900/85 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-3" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between mb-1" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-emerald-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(Leaf, { className: "w-3.5 h-3.5" }), " Dietary Fiber (Gut & Satiety)"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-white" }, dailySummary.totals.fiber, "g ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-400 font-normal" }, "/ ", targets.fiber, "g"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500",
        style: { width: `${Math.min(100, dailySummary.totals.fiber / Math.max(1, targets.fiber) * 100)}%` }
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "pt-2 border-t border-slate-800/80" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-sky-400 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(GlassWater, { className: "w-3.5 h-3.5" }), " Hydration (", waterMl, " / ", targets.waterMl, " ml)"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-1" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => updateCurrentDay((d) => __spreadProps(__spreadValues({}, d), { waterMl: Math.max(0, (d.waterMl || 0) - 250) })),
        className: "px-2 py-0.5 text-[11px] font-bold rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
      },
      "-250"
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => updateCurrentDay((d) => __spreadProps(__spreadValues({}, d), { waterMl: (d.waterMl || 0) + 250 })),
        className: "px-2 py-0.5 text-[11px] font-bold rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30"
      },
      "+250ml"
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-1.5 flex-wrap" }, Array.from({ length: Math.min(12, totalGlasses) }).map((_, idx) => {
      const filled = idx < drankGlasses;
      return /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          key: idx,
          type: "button",
          onClick: () => updateCurrentDay((d) => __spreadProps(__spreadValues({}, d), { waterMl: (idx + 1) * 250 })),
          title: `Set hydration to ${(idx + 1) * 250} ml`,
          className: `w-6 h-7 rounded-md border flex items-center justify-center transition-all ${filled ? "bg-sky-500/30 border-sky-400 text-sky-300 shadow-sm shadow-sky-500/20" : "bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700"}`
        },
        /* @__PURE__ */ import_react3.default.createElement(GlassWater, { className: "w-3.5 h-3.5" })
      );
    })))))), /* @__PURE__ */ import_react3.default.createElement("section", { className: "flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800/90 p-2 rounded-2xl" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setActiveWorkspaceTab("planner"),
        className: `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeWorkspaceTab === "planner" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`
      },
      /* @__PURE__ */ import_react3.default.createElement(Utensils, { className: "w-4 h-4" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Meal Planner & Explorer")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setActiveWorkspaceTab("ai_coach"),
        className: `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeWorkspaceTab === "ai_coach" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`
      },
      /* @__PURE__ */ import_react3.default.createElement(Brain, { className: "w-4 h-4" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "AI Macro Gap Coach"),
      aiRecommendations.suggestions.length > 0 && /* @__PURE__ */ import_react3.default.createElement("span", { className: "px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950 text-emerald-400" }, aiRecommendations.suggestions.length, " Picks")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setActiveWorkspaceTab("workout_fasting"),
        className: `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeWorkspaceTab === "workout_fasting" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`
      },
      /* @__PURE__ */ import_react3.default.createElement(Dumbbell, { className: "w-4 h-4" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Workout Burn & IF Timer"),
      totalBurnedCalories > 0 && /* @__PURE__ */ import_react3.default.createElement("span", { className: "px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-300" }, "+", totalBurnedCalories, " kcal")
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setActiveWorkspaceTab("grocery"),
        className: `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeWorkspaceTab === "grocery" ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" : "text-slate-300 hover:text-white hover:bg-slate-800/70"}`
      },
      /* @__PURE__ */ import_react3.default.createElement(ShoppingCart, { className: "w-4 h-4" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Smart Grocery List"),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950 text-cyan-400" }, (currentDayObj.meals || []).length)
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "hidden md:flex items-center gap-2 pr-2 text-xs text-slate-400" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "Logging for:"), /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-emerald-400 font-mono" }, selectedDate))), activeWorkspaceTab === "ai_coach" && /* @__PURE__ */ import_react3.default.createElement("section", { className: "bg-slate-900/85 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xl" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "sm" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-lg font-extrabold text-white" }, "NutriPulse AI Nutritionist & Macro Gap Solver"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" }, "Real-Time Solver")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, aiRecommendations.headline))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400" }, "Add picks into:"), /* @__PURE__ */ import_react3.default.createElement(
      "select",
      {
        value: activeMealSlot,
        onChange: (e) => setActiveMealSlot(e.target.value),
        className: "bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-400"
      },
      MEAL_SLOTS.map((s) => /* @__PURE__ */ import_react3.default.createElement("option", { key: s.id, value: s.id }, s.label))
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex items-start gap-3" }, /* @__PURE__ */ import_react3.default.createElement(Sparkles, { className: "w-5 h-5 text-emerald-400 shrink-0 mt-0.5" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "text-xs sm:text-sm text-slate-200 leading-relaxed" }, aiRecommendations.advice)), aiRecommendations.suggestions.length > 0 && /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" }, aiRecommendations.suggestions.map((rec, idx) => /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        key: idx,
        className: "bg-slate-950/90 border border-slate-800 hover:border-emerald-500/50 rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-lg"
      },
      /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative h-32 w-full" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: rec.food.image, alt: rec.food.name, className: "w-full h-full" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute top-2.5 left-2.5" }, /* @__PURE__ */ import_react3.default.createElement(VegBadge, { veg: rec.food.veg, size: "sm" })), /* @__PURE__ */ import_react3.default.createElement("span", { className: "absolute bottom-2 right-2 text-xs font-black px-2.5 py-0.5 rounded-lg bg-slate-950/90 text-emerald-400 border border-emerald-500/40" }, "+", rec.totalCal, " kcal (", rec.servings, "x)")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-3.5 space-y-1.5" }, /* @__PURE__ */ import_react3.default.createElement("h4", { className: "text-sm font-bold text-white leading-snug" }, rec.food.name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-emerald-300 font-medium" }, rec.reason), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between text-xs pt-2 border-t border-slate-800/80" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-indigo-400 font-bold" }, "+", rec.totalP, "g P"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-amber-400 font-bold" }, "+", rec.totalC, "g C"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-rose-400 font-bold" }, "+", rec.totalF, "g F")))),
      /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-3.5 pt-0" }, /* @__PURE__ */ import_react3.default.createElement(
        "button",
        {
          onClick: () => addFoodToMeal(rec.food.id, activeMealSlot, rec.servings),
          className: "w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5"
        },
        /* @__PURE__ */ import_react3.default.createElement(Plus, { className: "w-3.5 h-3.5" }),
        /* @__PURE__ */ import_react3.default.createElement("span", null, "Add ", rec.servings, "x to ", activeMealSlot)
      ))
    )))), activeWorkspaceTab === "workout_fasting" && /* @__PURE__ */ import_react3.default.createElement("section", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-6 bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(Dumbbell, { className: "w-5 h-5 text-amber-400" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base font-bold text-white" }, "Real-Time Exercise & Active Calorie Burn"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, "MET-based expenditure scaled to your ", profile.weight, "kg bodyweight"))), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-sm font-extrabold text-amber-400 bg-amber-500/15 px-3 py-1 rounded-xl border border-amber-500/30" }, totalBurnedCalories, " kcal burned")), /* @__PURE__ */ import_react3.default.createElement("form", { onSubmit: handleLogWorkout, className: "grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "sm:col-span-6" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase text-slate-400 mb-1" }, "Activity Type"), /* @__PURE__ */ import_react3.default.createElement(
      "select",
      {
        value: workoutForm.typeId,
        onChange: (e) => setWorkoutForm(__spreadProps(__spreadValues({}, workoutForm), { typeId: e.target.value })),
        className: "w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white"
      },
      WORKOUT_TYPES.map((w) => /* @__PURE__ */ import_react3.default.createElement("option", { key: w.id, value: w.id }, w.icon, " ", w.label, " (", w.met, " MET)"))
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "sm:col-span-3" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase text-slate-400 mb-1" }, "Duration (Min)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        min: "5",
        max: "300",
        value: workoutForm.minutes,
        onChange: (e) => setWorkoutForm(__spreadProps(__spreadValues({}, workoutForm), { minutes: e.target.value })),
        className: "w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-amber-400"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "sm:col-span-3 flex items-end" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "submit",
        className: "w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition-all"
      },
      "+ Log Burn"
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "space-y-2" }, (currentDayObj.workouts || []).length === 0 ? /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-500 text-center py-6" }, "No workouts logged for ", selectedDate, ". Add a training session above to dynamically adjust your calorie & hydration targets!") : (currentDayObj.workouts || []).map((w) => /* @__PURE__ */ import_react3.default.createElement("div", { key: w.id, className: "flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-lg" }, w.icon || "\u{1F3CB}\uFE0F"), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs sm:text-sm font-bold text-white" }, w.label || "Strength Session"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-400" }, w.minutes, " minutes active duration"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-extrabold text-amber-400" }, "+", w.caloriesBurned, " kcal"), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => removeWorkout(w.id),
        className: "p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400"
      },
      /* @__PURE__ */ import_react3.default.createElement(Trash2, { className: "w-3.5 h-3.5" })
    )))))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-6 bg-slate-900/85 border border-slate-800 rounded-2xl p-5 space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(Timer, { className: "w-5 h-5 text-cyan-400" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base font-bold text-white" }, "Live Intermittent Fasting & Metabolic Timer"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, fastingStatus.windowLabel))), /* @__PURE__ */ import_react3.default.createElement("span", { className: `text-xs font-bold px-2.5 py-1 rounded-full border ${fastingStatus.isFasting ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"}` }, fastingStatus.isFasting ? "Fasting Active" : "Feeding Window")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950/90 border border-slate-800 rounded-2xl p-5 text-center space-y-3" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] font-bold uppercase tracking-widest text-cyan-400 block" }, fastingStatus.zone), /* @__PURE__ */ import_react3.default.createElement("div", { className: "text-4xl sm:text-5xl font-mono font-black tracking-wider text-white" }, fastingStatus.countdown), /* @__PURE__ */ import_react3.default.createElement("div", { className: "w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-1000",
        style: { width: `${fastingStatus.pct}%` }
      }
    )), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, fastingStatus.pct, "% of current ", fastingStatus.isFasting ? "fasting" : "feeding", " phase complete")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2" }, FASTING_PROTOCOLS.map((fp) => /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: fp.id,
        type: "button",
        onClick: () => {
          setProfile(__spreadProps(__spreadValues({}, profile), { fastingProtocol: fp.id }));
          triggerToast(`Switched to ${fp.label} protocol`);
        },
        className: `p-2.5 rounded-xl border text-left transition-all ${profile.fastingProtocol === fp.id ? "bg-cyan-500/20 border-cyan-500/60 text-white" : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"}`
      },
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-extrabold text-cyan-300 block" }, fp.label),
      /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] text-slate-400 mt-0.5 block leading-tight" }, fp.desc)
    ))))), activeWorkspaceTab === "grocery" && /* @__PURE__ */ import_react3.default.createElement("section", { className: "bg-slate-900/85 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement(ShoppingCart, { className: "w-5 h-5 text-emerald-400" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-lg font-bold text-white" }, "Automated Smart Grocery & Meal Prep Checklist"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, "Aggregated ingredients and portion multiples for ", selectedDate))), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => {
          const lines = ["=== NUTRIPULSE PRO GROCERY LIST ==="];
          Object.entries(groceryList).forEach(([aisle, items]) => {
            lines.push(`
[${aisle.toUpperCase()}]`);
            Object.values(items).forEach((it) => {
              lines.push(`- ${it.food.name}: ${it.totalServings}x (${it.food.serving})`);
            });
          });
          copyTextToClipboard(lines.join("\n"), "Copied categorized grocery list to clipboard!");
        },
        className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
      },
      /* @__PURE__ */ import_react3.default.createElement(Copy, { className: "w-3.5 h-3.5" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Copy Shopping List")
    )), Object.keys(groceryList).length === 0 ? /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-sm text-slate-400 text-center py-8" }, "Your meal log for ", selectedDate, " is empty. Load a Smart Template or add dishes to automatically build your grocery list!") : /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" }, Object.entries(groceryList).map(([aisle, itemsObj]) => /* @__PURE__ */ import_react3.default.createElement("div", { key: aisle, className: "bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3" }, /* @__PURE__ */ import_react3.default.createElement("h4", { className: "text-xs font-extrabold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2" }, aisle), /* @__PURE__ */ import_react3.default.createElement("div", { className: "space-y-2" }, Object.values(itemsObj).map((item) => {
      const key = `${selectedDate}_${item.food.id}`;
      const isChecked = !!checkedGroceries[key];
      return /* @__PURE__ */ import_react3.default.createElement(
        "div",
        {
          key: item.food.id,
          onClick: () => setCheckedGroceries((prev) => __spreadProps(__spreadValues({}, prev), { [key]: !prev[key] })),
          className: `flex items-center justify-between gap-2.5 p-2 rounded-xl border cursor-pointer transition-all ${isChecked ? "bg-slate-900/40 border-slate-800/40 opacity-50 line-through" : "bg-slate-900/90 border-slate-800 hover:border-emerald-500/40"}`
        },
        /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5 min-w-0" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: item.food.image, alt: item.food.name, className: "w-9 h-9 rounded-lg shrink-0" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs font-bold text-white truncate" }, item.food.name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[10px] text-slate-400" }, item.totalServings, "x (", item.food.serving, ")"))),
        /* @__PURE__ */ import_react3.default.createElement(
          "input",
          {
            type: "checkbox",
            checked: isChecked,
            onChange: () => {
            },
            className: "rounded accent-emerald-500 shrink-0"
          }
        )
      );
    })))))), /* @__PURE__ */ import_react3.default.createElement("section", { className: "bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement(Sparkles, { className: "w-4 h-4 text-amber-400" }), /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200" }, "1-Click Smart Meal Templates")), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => {
          updateCurrentDay((d) => __spreadProps(__spreadValues({}, d), { meals: [] }));
          triggerToast(`Cleared all meals for ${selectedDate}`);
        },
        className: "text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 self-start sm:self-auto"
      },
      /* @__PURE__ */ import_react3.default.createElement(Trash2, { className: "w-3.5 h-3.5" }),
      " Clear ",
      selectedDate,
      " Plan"
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" }, SMART_TEMPLATES.map((tpl) => {
      const previewFoods = tpl.entries.map((e) => foodDb.find((f) => f.id === e.foodId)).filter(Boolean).slice(0, 5);
      return /* @__PURE__ */ import_react3.default.createElement(
        "div",
        {
          key: tpl.id,
          onClick: () => applyTemplate(tpl),
          className: "group cursor-pointer bg-slate-950/85 hover:bg-slate-900 border border-slate-800/90 hover:border-emerald-500/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-lg"
        },
        /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative h-28 w-full overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement(
          FoodImage,
          {
            src: tpl.cover,
            alt: tpl.title,
            className: "w-full h-full group-hover:scale-105 transition-transform duration-500"
          }
        ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" }), /* @__PURE__ */ import_react3.default.createElement("span", { className: "absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-950/85 text-emerald-400 border border-emerald-500/30 backdrop-blur-md" }, tpl.badge)), /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-3.5" }, /* @__PURE__ */ import_react3.default.createElement("h4", { className: "text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug" }, tpl.title), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 mt-1 line-clamp-2" }, tpl.subtitle))),
        /* @__PURE__ */ import_react3.default.createElement("div", { className: "px-3.5 pb-3.5 pt-2 border-t border-slate-800/60 flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center -space-x-2 overflow-hidden" }, previewFoods.map((pf, i) => /* @__PURE__ */ import_react3.default.createElement(
          "div",
          {
            key: i,
            className: "w-7 h-7 rounded-full border-2 border-slate-950 overflow-hidden shrink-0",
            title: pf.name
          },
          /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: pf.image, alt: pf.name, className: "w-full h-full" })
        )), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] text-slate-400 pl-3 font-medium" }, "+", Math.max(0, tpl.entries.length - previewFoods.length), " more")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5" }, "Load ", /* @__PURE__ */ import_react3.default.createElement(ChevronRight, { className: "w-3.5 h-3.5" })))
      );
    }))), /* @__PURE__ */ import_react3.default.createElement("section", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-7 space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement(Utensils, { className: "w-5 h-5 text-emerald-400" }), /* @__PURE__ */ import_react3.default.createElement("h2", { className: "text-lg font-bold text-white" }, "Daily Meal Log (", selectedDate, ")")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400" }, "Click any meal card to set it as active target")), MEAL_SLOTS.map((slot) => {
      const Icon2 = slot.icon;
      const mealData = dailySummary.byMeal[slot.id] || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: [] };
      const isSelected = activeMealSlot === slot.id;
      return /* @__PURE__ */ import_react3.default.createElement(
        "div",
        {
          key: slot.id,
          onClick: () => setActiveMealSlot(slot.id),
          className: `rounded-2xl border transition-all cursor-pointer overflow-hidden ${isSelected ? "bg-slate-900/95 border-emerald-500/60 shadow-xl shadow-emerald-500/5" : "bg-slate-900/60 border-slate-800/80 hover:border-slate-700"}`
        },
        /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative h-20 overflow-hidden border-b border-slate-800/80" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: slot.banner, alt: slot.label, className: "w-full h-full" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/60" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative z-10 h-full px-4 flex flex-wrap items-center justify-between gap-2" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: `w-10 h-10 rounded-xl ${slot.bg} ${slot.border} border backdrop-blur-md flex items-center justify-center ${slot.color}` }, /* @__PURE__ */ import_react3.default.createElement(Icon2, { className: "w-5 h-5" })), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base font-bold text-white" }, slot.label), isSelected && /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" }, "Active Target")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-300" }, slot.time, " \u2022 ", mealData.items.length, " dishes"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "text-right bg-slate-950/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800/80" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "font-extrabold text-white text-sm" }, mealData.calories, " kcal"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2 text-[11px] text-slate-300" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-indigo-400 font-semibold" }, mealData.protein, "g P"), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u2022"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-amber-400 font-semibold" }, mealData.carbs, "g C"), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u2022"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-rose-400 font-semibold" }, mealData.fat, "g F"))))),
        /* @__PURE__ */ import_react3.default.createElement("div", { className: "divide-y divide-slate-800/60" }, mealData.items.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-6 text-center text-xs text-slate-400" }, "No foods logged in ", /* @__PURE__ */ import_react3.default.createElement("strong", null, slot.label), " yet. Pick any dish from the Food Explorer on the right!") : mealData.items.map((item) => /* @__PURE__ */ import_react3.default.createElement(
          "div",
          {
            key: item.id,
            onClick: (e) => e.stopPropagation(),
            className: "p-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-950/40 transition-colors"
          },
          /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3 flex-1 min-w-0" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative w-14 h-14 rounded-xl overflow-hidden border border-slate-700/80 shrink-0 shadow-md" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: item.food.image, alt: item.food.name, className: "w-full h-full" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute top-1 left-1" }, /* @__PURE__ */ import_react3.default.createElement(VegBadge, { veg: item.food.veg, size: "sm" }))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "min-w-0 flex-1" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-sm font-bold text-slate-100 truncate" }, item.food.name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, item.food.serving, " \u2022", " ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-emerald-400 font-bold" }, item.computed.calories, " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap items-center gap-1.5 mt-1" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300" }, item.computed.protein, "g P"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300" }, item.computed.carbs, "g C"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300" }, item.computed.fat, "g F")))),
          /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2 self-end sm:self-center" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1" }, [0.5, 1, 1.5, 2].map((presetMult) => /* @__PURE__ */ import_react3.default.createElement(
            "button",
            {
              key: presetMult,
              type: "button",
              onClick: () => updateEntryServings(item.id, presetMult),
              className: `px-2 py-1 rounded-lg text-xs font-bold transition-colors ${Number(item.servings) === presetMult ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`
            },
            presetMult,
            "x"
          )), /* @__PURE__ */ import_react3.default.createElement(
            "input",
            {
              type: "number",
              step: "0.25",
              min: "0.25",
              max: "20",
              value: item.servings,
              onChange: (e) => updateEntryServings(item.id, e.target.value),
              className: "w-12 text-center bg-slate-900 border-l border-slate-800 text-xs font-bold text-emerald-400 py-1 ml-1 rounded-r-lg focus:outline-none",
              title: "Custom serving multiplier"
            }
          )), /* @__PURE__ */ import_react3.default.createElement(
            "button",
            {
              type: "button",
              onClick: () => removeEntry(item.id),
              className: "p-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 transition-colors",
              title: "Remove dish"
            },
            /* @__PURE__ */ import_react3.default.createElement(Trash2, { className: "w-4 h-4" })
          ))
        )))
      );
    })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "lg:col-span-5 bg-slate-900/85 border border-slate-800 rounded-2xl p-4 sm:p-5 lg:sticky lg:top-28 space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h2", { className: "text-base font-bold text-white flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement("span", null, "Food Explorer"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono" }, filteredFoods.length, " dishes")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 mt-0.5" }, "Adding to:", " ", /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-emerald-400 underline decoration-emerald-500/40" }, activeMealSlot))), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setVegOnly(!vegOnly),
        className: `px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${vegOnly ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300" : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"}`
      },
      /* @__PURE__ */ import_react3.default.createElement(VegBadge, { veg: true, size: "sm" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, "Pure Veg")
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800" }, MEAL_SLOTS.map((slot) => /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: slot.id,
        type: "button",
        onClick: () => setActiveMealSlot(slot.id),
        className: `py-1.5 px-2 rounded-lg text-xs font-semibold transition-all truncate ${activeMealSlot === slot.id ? "bg-emerald-500 text-slate-950 font-bold shadow" : "text-slate-400 hover:text-white"}`
      },
      slot.label
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative" }, /* @__PURE__ */ import_react3.default.createElement(Search, { className: "w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "text",
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        placeholder: "Search pesarattu, idli, biryani, paneer, chicken, oats...",
        className: "w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-10 pr-8 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
      }
    ), searchQuery && /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setSearchQuery(""),
        className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
      },
      /* @__PURE__ */ import_react3.default.createElement(X, { className: "w-4 h-4" })
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar" }, ["All", "High Protein", "Indian Staples", "Grains & Carbs", "Dairy & Plant", "Fats & Nuts", "Fruits & Veggies"].map((cat) => /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: cat,
        type: "button",
        onClick: () => setSelectedCategory(cat),
        className: `px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${selectedCategory === cat ? "bg-indigo-500 text-white font-semibold shadow-sm" : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"}`
      },
      cat
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1" }, filteredFoods.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "sm:col-span-2 text-center py-8 px-4 bg-slate-950/60 rounded-xl border border-slate-800" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-sm text-slate-400" }, "No matching dishes found."), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowCustomFoodModal(true),
        className: "mt-3 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/30"
      },
      '+ Create "',
      searchQuery || "New Dish",
      '"'
    )) : filteredFoods.map((food) => {
      const kcal = calcFoodCalories(food.protein, food.carbs, food.fat);
      return /* @__PURE__ */ import_react3.default.createElement(
        "div",
        {
          key: food.id,
          className: "rounded-2xl bg-slate-950/90 border border-slate-800/90 hover:border-emerald-500/50 overflow-hidden flex flex-col justify-between transition-all group shadow-md"
        },
        /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("div", { className: "relative h-28 w-full overflow-hidden" }, /* @__PURE__ */ import_react3.default.createElement(
          FoodImage,
          {
            src: food.image,
            alt: food.name,
            className: "w-full h-full group-hover:scale-105 transition-transform duration-500"
          }
        ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" }), /* @__PURE__ */ import_react3.default.createElement("div", { className: "absolute top-2 left-2 flex items-center gap-1.5" }, /* @__PURE__ */ import_react3.default.createElement(VegBadge, { veg: food.veg, size: "sm" }), food.isCustom && /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/90 text-white" }, "Custom")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "absolute bottom-2 right-2 text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-slate-950/90 text-emerald-400 border border-emerald-500/30 backdrop-blur-md" }, kcal, " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "p-3" }, /* @__PURE__ */ import_react3.default.createElement("h4", { className: "text-xs sm:text-sm font-bold text-white line-clamp-1", title: food.name }, food.name), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-[11px] text-slate-400 mt-0.5 truncate" }, food.serving), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between gap-1 mt-2 pt-2 border-t border-slate-800/80 text-[11px]" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-indigo-400 font-bold" }, food.protein, "g P"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-amber-400 font-bold" }, food.carbs, "g C"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-rose-400 font-bold" }, food.fat, "g F")))),
        /* @__PURE__ */ import_react3.default.createElement("div", { className: "px-3 pb-3" }, /* @__PURE__ */ import_react3.default.createElement(
          "button",
          {
            type: "button",
            onClick: () => addFoodToMeal(food.id, activeMealSlot, 1),
            className: "w-full py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 font-bold text-xs border border-emerald-500/30 transition-all flex items-center justify-center gap-1"
          },
          /* @__PURE__ */ import_react3.default.createElement(Plus, { className: "w-3.5 h-3.5" }),
          /* @__PURE__ */ import_react3.default.createElement("span", null, "Add to ", activeMealSlot)
        ))
      );
    }))))), /* @__PURE__ */ import_react3.default.createElement("footer", { className: "relative z-10 max-w-7xl mx-auto px-4 sm:px-6 mt-14 pt-8 border-t border-slate-800/80 space-y-6 text-xs text-slate-400" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4" }, /* @__PURE__ */ import_react3.default.createElement(
      NutriPulseLogo,
      {
        size: "sm",
        showWordmark: true,
        interactive: true,
        onClick: () => setShowBrandModal(true)
      }
    ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap items-center gap-4" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowGithubModal(true),
        className: "text-cyan-400 hover:underline font-bold flex items-center gap-1"
      },
      /* @__PURE__ */ import_react3.default.createElement(Download, { className: "w-3.5 h-3.5" }),
      " Download Full-Stack GitHub & Vercel Repo (.zip)"
    ), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u2022"), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowBrandModal(true),
        className: "text-emerald-400 hover:underline font-semibold"
      },
      "Brand Logo & Identity Kit"
    ), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u2022"), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowExportModal(true),
        className: "text-slate-300 hover:text-white"
      },
      "Export / Print Daily Report"
    ), /* @__PURE__ */ import_react3.default.createElement("span", null, "\u2022"), /* @__PURE__ */ import_react3.default.createElement("span", null, "Atwater 4-4-9 Clinical Standard"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "pt-5 border-t border-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400" }, /* @__PURE__ */ import_react3.default.createElement("p", null, "\xA9 ", (/* @__PURE__ */ new Date()).getFullYear(), " ", /* @__PURE__ */ import_react3.default.createElement("strong", { className: "text-emerald-400 font-bold" }, "Ballapuram Prakash Royal"), ". All Rights Reserved."), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-slate-500 text-center sm:text-right" }, "Protected under the Copyright Act, 1957 & International Intellectual Property Laws. Unauthorized reproduction or distribution is strictly prohibited."))), showGithubModal && /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "sm" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base sm:text-lg font-bold text-white" }, "GitHub & Vercel Full-Stack Repository Exporter"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, "Pre-configured Multi-File Frontend (`/src`) + Vercel Serverless API (`/api`) + Python FastAPI (`/backend`)"))), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowGithubModal(false),
        className: "p-1.5 rounded-lg text-slate-400 hover:text-white"
      },
      /* @__PURE__ */ import_react3.default.createElement(X, { className: "w-4 h-4" })
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-1.5 max-h-64 overflow-y-auto" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-emerald-400 font-bold mb-2" }, "\u{1F4E6} nutripulse-pro-fullstack-repo.zip Structure:"), /* @__PURE__ */ import_react3.default.createElement("p", null, "\u251C\u2500\u2500 package.json ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(React 18, Vite 6, Tailwind v4, Lucide Icons)")), /* @__PURE__ */ import_react3.default.createElement("p", null, "\u251C\u2500\u2500 vite.config.js ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(Zero-config Vite + Tailwind bundler)")), /* @__PURE__ */ import_react3.default.createElement("p", null, "\u251C\u2500\u2500 vercel.json ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(Links SPA Frontend + /api Serverless Routes)")), /* @__PURE__ */ import_react3.default.createElement("p", null, "\u251C\u2500\u2500 index.html & .gitignore & README.md"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-cyan-400 font-semibold pt-1" }, "\u251C\u2500\u2500 src/ (Frontend Application)"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u251C\u2500\u2500 main.jsx & index.css"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u251C\u2500\u2500 App.jsx ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(Complete NutriPulse Pro UI)")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u251C\u2500\u2500 services/apiClient.js ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(REST client linked to /api)")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u2514\u2500\u2500 constants/nutritionConstants.js"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-amber-400 font-semibold pt-1" }, "\u251C\u2500\u2500 api/ (Vercel Node.js Serverless Backend)"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u251C\u2500\u2500 health.js ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(GET /api/health)")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u2514\u2500\u2500 tdee.js ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(POST /api/tdee Clinical Calculator)")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-indigo-400 font-semibold pt-1" }, "\u2514\u2500\u2500 backend/ (Python FastAPI Microservice)"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u251C\u2500\u2500 main.py ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "(FastAPI server with CORS)")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "pl-4" }, "\u2514\u2500\u2500 requirements.txt")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 text-xs text-slate-300 space-y-2" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "font-bold text-emerald-300" }, "How to Push to GitHub & Deploy to Vercel:"), /* @__PURE__ */ import_react3.default.createElement("ol", { className: "list-decimal list-inside space-y-1 text-slate-300" }, /* @__PURE__ */ import_react3.default.createElement("li", null, "Click ", /* @__PURE__ */ import_react3.default.createElement("strong", null, "Download Complete Repo (.zip)"), " below and extract the folder."), /* @__PURE__ */ import_react3.default.createElement("li", null, "Copy your current ", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-emerald-400" }, "App.jsx"), " code from this editor into ", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-emerald-400" }, "src/App.jsx"), " (or use the pre-bundled starter inside the ZIP)."), /* @__PURE__ */ import_react3.default.createElement("li", null, "Run ", /* @__PURE__ */ import_react3.default.createElement("code", { className: "text-cyan-300" }, "npm install && npm run dev"), " to verify locally, then push to GitHub and import into ", /* @__PURE__ */ import_react3.default.createElement("strong", null, "Vercel"), "."))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3 pt-2" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowGithubModal(false),
        className: "px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
      },
      "Close"
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        disabled: zipBusy,
        onClick: handleDirectZipDownload,
        className: "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
      },
      /* @__PURE__ */ import_react3.default.createElement(Download, { className: "w-4 h-4" }),
      /* @__PURE__ */ import_react3.default.createElement("span", null, zipBusy ? "Building ZIP Archive..." : "Download Complete Repo (.zip)")
    )))), showBrandModal && /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "sm" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base font-bold text-white" }, "NutriPulse Pro \u2014 Official Brand Identity"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, "High-Contrast Neon Emerald Leaf & Biometric ECG Emblem"))), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowBrandModal(false),
        className: "p-1 rounded-lg text-slate-400 hover:text-white"
      },
      /* @__PURE__ */ import_react3.default.createElement(X, { className: "w-4 h-4" })
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col items-center text-center space-y-4" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "xl" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h4", { className: "text-lg font-black text-white tracking-tight" }, "NUTRI", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-emerald-400" }, "PULSE"), " ", /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-cyan-400" }, "PRO")), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400 max-w-sm mt-1" }, "Combines an organic emerald-to-cyan leaf with circuit veins and a dark-outlined biometric ECG heartbeat wave inside a sleek slate squircle.")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-3 gap-2.5 w-full text-[11px]" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-2" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "w-4 h-4 rounded-full bg-[#0f172a] border border-slate-700 inline-block mb-1" }), /* @__PURE__ */ import_react3.default.createElement("span", { className: "block font-mono text-slate-300" }, "#0F172A"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "Slate Squircle")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-2" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "w-4 h-4 rounded-full bg-[#10b981] inline-block mb-1" }), /* @__PURE__ */ import_react3.default.createElement("span", { className: "block font-mono text-emerald-400" }, "#10B981"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "Bio Emerald")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-xl p-2" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "w-4 h-4 rounded-full bg-[#06b6d4] inline-block mb-1" }), /* @__PURE__ */ import_react3.default.createElement("span", { className: "block font-mono text-cyan-400" }, "#06B6D4"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-slate-500" }, "Pulse Cyan")))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-end gap-2" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: downloadBrandSvg,
        className: "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
      },
      /* @__PURE__ */ import_react3.default.createElement(Download, { className: "w-3.5 h-3.5" }),
      " Download Vector SVG Logo"
    )))), showQuickCalcModal && /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "xs" }), /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base font-bold text-white" }, "Instant Label Macro Estimator")), /* @__PURE__ */ import_react3.default.createElement("button", { onClick: () => setShowQuickCalcModal(false), className: "text-slate-400 hover:text-white" }, /* @__PURE__ */ import_react3.default.createElement(X, { className: "w-4 h-4" }))), /* @__PURE__ */ import_react3.default.createElement("form", { onSubmit: handleQuickAddMacroFood, className: "space-y-3.5" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs text-slate-400 mb-1" }, "Food / Label Name"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "text",
        required: true,
        value: quickMacro.name,
        onChange: (e) => setQuickMacro(__spreadProps(__spreadValues({}, quickMacro), { name: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-indigo-400 font-bold mb-1" }, "Protein (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        value: quickMacro.protein,
        onChange: (e) => setQuickMacro(__spreadProps(__spreadValues({}, quickMacro), { protein: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-amber-400 font-bold mb-1" }, "Carbs (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        value: quickMacro.carbs,
        onChange: (e) => setQuickMacro(__spreadProps(__spreadValues({}, quickMacro), { carbs: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-rose-400 font-bold mb-1" }, "Fat (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        value: quickMacro.fat,
        onChange: (e) => setQuickMacro(__spreadProps(__spreadValues({}, quickMacro), { fat: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-emerald-400 font-bold mb-1" }, "Fiber (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        value: quickMacro.fiber,
        onChange: (e) => setQuickMacro(__spreadProps(__spreadValues({}, quickMacro), { fiber: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-xs text-slate-400" }, "Atwater Verified Energy:"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-lg font-black text-emerald-400" }, calcFoodCalories(Number(quickMacro.protein) || 0, Number(quickMacro.carbs) || 0, Number(quickMacro.fat) || 0), " kcal")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-end gap-2" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowQuickCalcModal(false),
        className: "px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300"
      },
      "Cancel"
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "submit",
        className: "px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
      },
      "Log into ",
      activeMealSlot
    ))))), showCustomFoodModal && /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "xs" }), /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base font-bold text-white" }, "Add Custom Dish")), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowCustomFoodModal(false),
        className: "p-1 rounded-lg text-slate-400 hover:text-white"
      },
      /* @__PURE__ */ import_react3.default.createElement(X, { className: "w-4 h-4" })
    )), /* @__PURE__ */ import_react3.default.createElement("form", { onSubmit: handleCreateCustomFood, className: "space-y-3.5" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3.5 bg-slate-950/80 border border-slate-800 p-3 rounded-xl" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shrink-0" }, /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: newFood.image, alt: "Custom Preview", className: "w-full h-full" })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase tracking-wider text-slate-400 mb-1" }, "Dish Image URL (Optional)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "url",
        placeholder: "https://images.unsplash.com/...",
        value: newFood.image,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { image: e.target.value })),
        className: "w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5" }, "Or Select a Dish Icon"), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-4 sm:grid-cols-8 gap-1.5" }, CUSTOM_FOOD_GALLERY.map((item) => /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        key: item.id,
        type: "button",
        onClick: () => setNewFood(__spreadProps(__spreadValues({}, newFood), { image: item.url })),
        className: `relative rounded-lg overflow-hidden h-12 border-2 transition-all ${newFood.image === item.url ? "border-emerald-400 scale-105 shadow-md" : "border-transparent opacity-70 hover:opacity-100"}`,
        title: item.label
      },
      /* @__PURE__ */ import_react3.default.createElement(FoodImage, { src: item.url, alt: item.label, className: "w-full h-full" })
    )))), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs text-slate-400 mb-1" }, "Dish Name *"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "text",
        required: true,
        placeholder: "e.g., Homemade Paneer Bhurji / Ragi Dosa",
        value: newFood.name,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { name: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 gap-3" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs text-slate-400 mb-1" }, "Serving Size Label"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "text",
        placeholder: "e.g., 150g bowl",
        value: newFood.serving,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { serving: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-xs text-slate-400 mb-1" }, "Category"), /* @__PURE__ */ import_react3.default.createElement(
      "select",
      {
        value: newFood.category,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { category: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
      },
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "High Protein" }, "High Protein"),
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "Indian Staples" }, "Indian Staples"),
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "Grains & Carbs" }, "Grains & Carbs"),
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "Dairy & Plant" }, "Dairy & Plant"),
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "Fats & Nuts" }, "Fats & Nuts"),
      /* @__PURE__ */ import_react3.default.createElement("option", { value: "Fruits & Veggies" }, "Fruits & Veggies")
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5" }, /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-indigo-400 font-semibold mb-1" }, "Protein (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        required: true,
        value: newFood.protein,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { protein: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-amber-400 font-semibold mb-1" }, "Carbs (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        required: true,
        value: newFood.carbs,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { carbs: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-rose-400 font-semibold mb-1" }, "Fat (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        required: true,
        value: newFood.fat,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { fat: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    )), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("label", { className: "block text-[11px] text-emerald-400 font-semibold mb-1" }, "Fiber (g)"), /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "number",
        step: "0.1",
        min: "0",
        value: newFood.fiber,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { fiber: e.target.value })),
        className: "w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-white"
      }
    ))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between bg-slate-950/90 border border-slate-800 rounded-xl p-3" }, /* @__PURE__ */ import_react3.default.createElement("label", { className: "flex items-center gap-2 text-xs text-slate-300 cursor-pointer" }, /* @__PURE__ */ import_react3.default.createElement(
      "input",
      {
        type: "checkbox",
        checked: newFood.veg,
        onChange: (e) => setNewFood(__spreadProps(__spreadValues({}, newFood), { veg: e.target.checked })),
        className: "rounded accent-emerald-500"
      }
    ), /* @__PURE__ */ import_react3.default.createElement(VegBadge, { veg: newFood.veg, size: "sm" }), /* @__PURE__ */ import_react3.default.createElement("span", null, newFood.veg ? "Vegetarian Dish" : "Non-Vegetarian Dish")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "text-right" }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-[11px] text-slate-400 block" }, "Auto-Calculated Calories"), /* @__PURE__ */ import_react3.default.createElement("span", { className: "text-sm font-extrabold text-emerald-400" }, calcFoodCalories(Number(newFood.protein) || 0, Number(newFood.carbs) || 0, Number(newFood.fat) || 0), " kcal"))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex justify-end gap-2 pt-2" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "button",
        onClick: () => setShowCustomFoodModal(false),
        className: "px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
      },
      "Cancel"
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        type: "submit",
        className: "px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
      },
      "Save & Add to ",
      activeMealSlot
    ))))), showExportModal && /* @__PURE__ */ import_react3.default.createElement("div", { className: "fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center justify-between border-b border-slate-800 pb-3" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ import_react3.default.createElement(NutriPulseLogo, { size: "sm" }), /* @__PURE__ */ import_react3.default.createElement("div", null, /* @__PURE__ */ import_react3.default.createElement("h3", { className: "text-base font-bold text-white" }, "NutriPulse Pro \u2014 Clinical Nutrition Report"), /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-xs text-slate-400" }, "Date: ", selectedDate, " \u2022 Goal: ", targets.goalLabel))), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => setShowExportModal(false),
        className: "p-1 rounded-lg text-slate-400 hover:text-white"
      },
      /* @__PURE__ */ import_react3.default.createElement(X, { className: "w-4 h-4" })
    )), /* @__PURE__ */ import_react3.default.createElement("div", { className: "bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-80 overflow-y-auto" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-emerald-400 font-bold" }, "=== NUTRIPULSE PRO DAILY REPORT (", selectedDate, ") ==="), /* @__PURE__ */ import_react3.default.createElement("p", null, "Biometrics: ", profile.weight, "kg | ", profile.height, "cm | BMR: ", targets.bmr, " kcal | TDEE: ", targets.tdee, " kcal"), /* @__PURE__ */ import_react3.default.createElement("p", null, "Target: ", targets.calories, " kcal | ", targets.protein, "g P | ", targets.carbs, "g C | ", targets.fat, "g F"), /* @__PURE__ */ import_react3.default.createElement("p", null, "Logged: ", dailySummary.totals.calories, " kcal | ", dailySummary.totals.protein, "g P | ", dailySummary.totals.carbs, "g C | ", dailySummary.totals.fat, "g F | ", dailySummary.totals.fiber, "g Fiber"), /* @__PURE__ */ import_react3.default.createElement("p", null, "Hydration: ", waterMl, " / ", targets.waterMl, " ml | Active Workout Burn: ", totalBurnedCalories, " kcal"), /* @__PURE__ */ import_react3.default.createElement("hr", { className: "border-slate-800 my-2" }), MEAL_SLOTS.map((slot) => {
      const m = dailySummary.byMeal[slot.id];
      return /* @__PURE__ */ import_react3.default.createElement("div", { key: slot.id, className: "pb-2" }, /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-white font-bold" }, slot.label.toUpperCase(), " (", m.calories, " kcal):"), m.items.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("p", { className: "text-slate-500 pl-2" }, "- None") : m.items.map((it) => /* @__PURE__ */ import_react3.default.createElement("p", { key: it.id, className: "pl-2" }, "\u2022 ", it.servings, "x ", it.food.name, " (", it.computed.calories, " kcal | ", it.computed.protein, "g P | ", it.computed.carbs, "g C | ", it.computed.fat, "g F)")));
    })), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex flex-wrap justify-between items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => window.print(),
        className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
      },
      /* @__PURE__ */ import_react3.default.createElement(Printer, { className: "w-3.5 h-3.5" }),
      " Print Report"
    ), /* @__PURE__ */ import_react3.default.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => {
          const blob = new Blob([JSON.stringify({ profile, daysData }, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `nutripulse-backup-${selectedDate}.json`;
          a.click();
          URL.revokeObjectURL(url);
          triggerToast("Downloaded JSON backup!");
        },
        className: "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30"
      },
      /* @__PURE__ */ import_react3.default.createElement(FileJson, { className: "w-3.5 h-3.5" }),
      " Export JSON"
    ), /* @__PURE__ */ import_react3.default.createElement(
      "button",
      {
        onClick: () => {
          const text = `NutriPulse Pro (${selectedDate})
Logged: ${dailySummary.totals.calories}/${targets.calories} kcal | P: ${dailySummary.totals.protein}/${targets.protein}g | C: ${dailySummary.totals.carbs}/${targets.carbs}g | F: ${dailySummary.totals.fat}/${targets.fat}g | Water: ${waterMl}ml`;
          copyTextToClipboard(text, "Copied report to clipboard!");
        },
        className: "flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400"
      },
      /* @__PURE__ */ import_react3.default.createElement(Copy, { className: "w-3.5 h-3.5" }),
      " Copy Summary"
    ))))));
  }

export default App;
