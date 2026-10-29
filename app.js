(function () {
  "use strict";
  var app = angular.module("electricityApp", []);

  app.controller("MainController", function ($scope) {
    var USERS_KEY = "wattwise_users_v1";
    var SESSION_KEY = "wattwise_session_v1";
    var DATA_PREFIX = "wattwise_data_v1_";
    var currentDataKey = null;

    $scope.authMode = "login";
    $scope.auth = {};
    $scope.showPassword = false;
    $scope.currentUser = null;
    $scope.page = "dashboard";
    $scope.mobileMenu = false;
    $scope.flashMessage = "";
    $scope.authError = "";
    $scope.readingError = "";
    $scope.readingSearch = "";
    $scope.todayLabel = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    $scope.settings = { tariff: 6.5, budgetDraft: 1500 };
    $scope.budget = 1500;
    $scope.readings = [];
    $scope.appliances = [];
    $scope.tips = [
      { icon: "💡", category: "LIGHTING", title: "Switch to LED bulbs", text: "LEDs typically use much less electricity than incandescent bulbs for similar light output.", done: false },
      { icon: "❄️", category: "COOLING", title: "Use AC thoughtfully", text: "Set a comfortable, efficient temperature, clean filters, and close doors and windows while cooling.", done: false },
      { icon: "🔌", category: "STANDBY POWER", title: "Turn off idle devices", text: "Switch off devices and power strips when practical instead of leaving equipment on standby.", done: false },
      { icon: "🌤️", category: "DAYLIGHT", title: "Use natural light", text: "Open curtains during daylight and turn off lights in empty rooms.", done: false },
      { icon: "🧺", category: "APPLIANCES", title: "Run full loads", text: "Where appropriate, run washing machines with full loads and choose efficient settings.", done: false },
      { icon: "🌀", category: "FANS", title: "Use fans where enough", text: "A fan can improve comfort and may let you use air conditioning less, depending on conditions.", done: false }
    ];
    $scope.challengeDays = [false, false, false, false, false, false, false];
    function localDateString(date) {
      var d = date || new Date();
      var year = d.getFullYear();
      var month = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      return year + "-" + month + "-" + day;
    }
    $scope.readingForm = { date: localDateString(), previous: null, current: null };
    $scope.applianceForm = { name: "", watts: 75, hours: 5, quantity: 1 };
    $scope.applianceError = "";

    function getUsers() {
      try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); }
      catch (e) { return []; }
    }
    function saveUsers(users) {
      try { localStorage.setItem(USERS_KEY, JSON.stringify(users)); return true; }
      catch (e) { return false; }
    }
    function dataKey(email) { return DATA_PREFIX + email.toLowerCase().replace(/[^a-z0-9]/g, "_"); }
    function loadUserData() {
      currentDataKey = dataKey($scope.currentUser.email);
      var d = {};
      try { d = JSON.parse(localStorage.getItem(currentDataKey) || "{}") || {}; } catch (e) { d = {}; }
      $scope.readings = Array.isArray(d.readings) ? d.readings : [];
      $scope.appliances = Array.isArray(d.appliances) ? d.appliances : [];
      $scope.settings.tariff = Number(d.tariff) >= 0 ? Number(d.tariff) : 6.5;
      $scope.budget = Number(d.budget) > 0 ? Number(d.budget) : 1500;
      $scope.settings.budgetDraft = $scope.budget;
      if (Array.isArray(d.tipsDone)) $scope.tips.forEach(function (t, i) { t.done = !!d.tipsDone[i]; });
      $scope.challengeDays = Array.isArray(d.challengeDays) && d.challengeDays.length === 7 ? d.challengeDays : [false, false, false, false, false, false, false];
      $scope.page = "dashboard";
    }
    function persist() {
      if (!currentDataKey) return false;
      var d = {
        readings: $scope.readings, appliances: $scope.appliances, tariff: $scope.settings.tariff,
        budget: $scope.budget, tipsDone: $scope.tips.map(function (t) { return !!t.done; }),
        challengeDays: $scope.challengeDays
      };
      try { localStorage.setItem(currentDataKey, JSON.stringify(d)); return true; }
      catch (e) { $scope.flashMessage = "Could not save data. Browser storage may be full."; return false; }
    }
    function establishSession(user) {
      $scope.currentUser = { name: user.name, email: user.email };
      try { localStorage.setItem(SESSION_KEY, user.email); } catch (e) {}
      loadUserData();
      $scope.auth = {};
      $scope.authError = "";
    }

    $scope.register = function () {
      $scope.authError = "";
      var name = ($scope.auth.name || "").trim();
      var email = ($scope.auth.email || "").trim().toLowerCase();
      var password = $scope.auth.password || "";
      if (!name || !email || !password) { $scope.authError = "Please complete every field."; return; }
      if (password.length < 6) { $scope.authError = "Use a password with at least 6 characters."; return; }
      if (password !== $scope.auth.confirmPassword) { $scope.authError = "Passwords do not match."; return; }
      var users = getUsers();
      if (users.some(function (u) { return u.email.toLowerCase() === email; })) { $scope.authError = "An account with this email already exists."; return; }
      // Demo-only: passwords are stored in browser localStorage. Never use this for real accounts.
      users.push({ name: name, email: email, password: password });
      if (!saveUsers(users)) { $scope.authError = "Could not save account in this browser."; return; }
      establishSession(users[users.length - 1]);
      $scope.flashMessage = "Account created. Welcome to WattWise!";
    };

    $scope.login = function () {
      $scope.authError = "";
      var email = ($scope.auth.email || "").trim().toLowerCase();
      var password = $scope.auth.password || "";
      var user = getUsers().find(function (u) { return u.email.toLowerCase() === email && u.password === password; });
      if (!user) { $scope.authError = "Email or password is incorrect. Register if this is your first visit."; return; }
      establishSession(user);
      $scope.flashMessage = "Welcome back!";
    };

    $scope.logout = function () {
      try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
      $scope.currentUser = null; $scope.page = "dashboard"; $scope.mobileMenu = false; $scope.authMode = "login"; $scope.auth = {};
    };
    $scope.go = function (page) { $scope.page = page; $scope.mobileMenu = false; $scope.flashMessage = ""; };
    $scope.pageTitle = function () {
      return ({ dashboard: "Dashboard", readings: "Meter readings", appliances: "Appliance estimator", saving: "Smart saving coach", reports: "Reports & goals" })[$scope.page] || "Dashboard";
    };
    $scope.totalUnits = function () { return $scope.readings.reduce(function (s, r) { return s + Number(r.units || 0); }, 0); };
    $scope.totalBill = function () { return $scope.readings.reduce(function (s, r) { return s + Number(r.bill || 0); }, 0); };
    function parseReadingDate(date) {
      if (!date) return null;
      if (date instanceof Date) return Number.isNaN(date.getTime()) ? null : date;
      if (typeof date !== "string") return null;
      date = date.trim();
      // HTML date inputs store YYYY-MM-DD. Also accept older saved DD/MM/YYYY
      // or DD-MM-YYYY values so existing browser data still counts by month.
      var parts;
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(date)) {
        parts = date.split("-");
        var isoDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return Number.isNaN(isoDate.getTime()) ? null : isoDate;
      }
      if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(date)) {
        parts = date.split(/[\/-]/);
        var dayFirst = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        return Number.isNaN(dayFirst.getTime()) ? null : dayFirst;
      }
      var parsed = new Date(date);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    function isCurrentMonth(date) {
      var d = parseReadingDate(date), now = new Date();
      return !!d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    function isPreviousMonth(date) {
      var d = parseReadingDate(date), now = new Date();
      var pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return !!d && d.getMonth() === pm.getMonth() && d.getFullYear() === pm.getFullYear();
    }
    $scope.monthUnits = function () { return $scope.readings.filter(function (r) { return isCurrentMonth(r.date); }).reduce(function (s, r) { return s + Number(r.units || 0); }, 0); };
    $scope.previousMonthUnits = function () { return $scope.readings.filter(function (r) { return isPreviousMonth(r.date); }).reduce(function (s, r) { return s + Number(r.units || 0); }, 0); };
    $scope.monthBill = function () { return $scope.monthUnits() * (Number($scope.settings.tariff) || 0); };
    $scope.monthChangePercent = function () { var prev = $scope.previousMonthUnits(); return prev > 0 ? (($scope.monthUnits() - prev) / prev) * 100 : 0; };
    $scope.monthChangeText = function () {
      if ($scope.previousMonthUnits() <= 0) return "Add last month's readings to compare";
      var c = $scope.monthChangePercent();
      return c > 0 ? c.toFixed(1) + "% higher than last month" : c < 0 ? Math.abs(c).toFixed(1) + "% lower than last month" : "Same as last month";
    };
    // Illustrative savings estimate: 10% of the current month's recorded bill.
    $scope.potentialSavings = function () {
      var bill = Number($scope.monthBill()) || 0;
      return Math.max(0, bill * 0.10);
    };
    $scope.budgetPercent = function () { var budget = Number($scope.budget) || 0; return budget > 0 ? Math.min(100, ($scope.monthBill() / budget) * 100) : 0; };
    $scope.budgetRemaining = function () { return Math.max(0, Number($scope.budget || 0) - $scope.monthBill()); };
    $scope.budgetProgressClass = function () { return $scope.budgetPercent() >= 100 ? "progress-fill danger" : $scope.budgetPercent() >= 80 ? "progress-fill warning-fill" : "progress-fill"; };
    $scope.$watchGroup([function () { return $scope.monthBill(); }, function () { return $scope.budget; }], function () {
      if (!$scope.currentUser) return;
      if ($scope.budget > 0 && $scope.monthBill() >= $scope.budget) $scope.budgetWarning = "Your estimated monthly bill has reached or exceeded your budget.";
      else if ($scope.budget > 0 && $scope.monthBill() >= $scope.budget * 0.8) $scope.budgetWarning = "Your estimated bill has reached 80% of your monthly budget.";
      else $scope.budgetWarning = "";
    });
    $scope.saveBudget = function () {
      var n = Number($scope.settings.budgetDraft);
      if (!Number.isFinite(n) || n <= 0) { $scope.flashMessage = "Enter a budget greater than zero."; return; }
      $scope.budget = n; persist(); $scope.flashMessage = "Monthly budget updated.";
    };
    $scope.addReading = function () {
      $scope.readingError = "";
      var p = Number($scope.readingForm.previous), c = Number($scope.readingForm.current), rate = Number($scope.settings.tariff);
      if (!$scope.readingForm.date || $scope.readingForm.previous === null || $scope.readingForm.previous === "" || $scope.readingForm.current === null || $scope.readingForm.current === "") { $scope.readingError = "Complete all reading fields."; return; }
      if (![p, c, rate].every(Number.isFinite) || p < 0 || c < p || rate < 0) { $scope.readingError = "Check your numbers. Current reading must be at least the previous reading."; return; }
      var units = c - p;
      $scope.readings.push({ id: Date.now(), date: $scope.readingForm.date, previous: p, current: c, units: units, bill: units * rate });
      if (!persist()) { $scope.readings.pop(); return; }
      $scope.readingForm = { date: localDateString(), previous: c, current: null };
      $scope.flashMessage = "Meter reading saved successfully."; $scope.page = "readings";
    };
    $scope.loadDemoReadings = function () {
      if ($scope.readings.length) {
        $scope.flashMessage = "You already have readings. Delete them first if you want to try the demo data.";
        return;
      }
      var now = new Date();
      var tariff = Number($scope.settings.tariff) || 6.5;
      var previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, Math.min(10, new Date(now.getFullYear(), now.getMonth(), 0).getDate()));
      var currentMonthDate = new Date(now.getFullYear(), now.getMonth(), Math.min(10, now.getDate()));
      function dateText(d) { return localDateString(d); }
      $scope.readings = [
        { id: Date.now() - 1, date: dateText(previousMonthDate), previous: 900, current: 1180, units: 280, bill: 280 * tariff },
        { id: Date.now(), date: dateText(currentMonthDate), previous: 1180, current: 1420, units: 240, bill: 240 * tariff }
      ];
      if (!persist()) { $scope.readings = []; return; }
      $scope.flashMessage = "Demo readings added for this month and last month. Usage, savings, budget and reports should now show sample values.";
    };
    $scope.deleteReading = function (id) {
      $scope.readings = $scope.readings.filter(function (r) { return r.id !== id; }); persist(); $scope.flashMessage = "Reading deleted.";
    };
    $scope.chartReadings = function () { return $scope.readings.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }).slice(-7); };
    $scope.barHeight = function (units) {
      var max = Math.max.apply(null, $scope.chartReadings().map(function (r) { return Number(r.units) || 0; }).concat([1]));
      return Math.max(4, (units / max) * 145) + "px";
    };
    $scope.dashboardTips = function () {
      var sorted = $scope.tips.slice().sort(function (a, b) { return Number(a.done) - Number(b.done); });
      return sorted.slice(0, 3);
    };
    $scope.saveTips = function () { persist(); };
    $scope.usageInsight = function () {
      if ($scope.previousMonthUnits() <= 0) return "Keep adding readings regularly. Once two months of data are available, this area can compare usage.";
      var diff = $scope.monthChangePercent();
      if (diff > 0) return "Your recorded usage is " + diff.toFixed(1) + "% higher than last month. Review appliance hours and try the tips above.";
      if (diff < 0) return "Nice work! Your recorded usage is " + Math.abs(diff).toFixed(1) + "% lower than last month. Keep up your energy-saving habits.";
      return "Your recorded usage is currently similar to last month. Try one small saving habit this week.";
    };
    $scope.addAppliance = function () {
      $scope.applianceError = "";
      var a = $scope.applianceForm, watts = Number(a.watts), hours = Number(a.hours), qty = Number(a.quantity);
      if (!a.name || !Number.isFinite(watts) || watts <= 0 || !Number.isFinite(hours) || hours < 0 || hours > 24 || !Number.isInteger(qty) || qty < 1) { $scope.applianceError = "Enter a name, valid wattage, 0–24 hours per day, and a whole-number quantity."; return; }
      $scope.appliances.push({ id: Date.now(), name: a.name.trim(), watts: watts, hours: hours, quantity: qty });
      persist(); $scope.applianceForm = { name: "", watts: 75, hours: 5, quantity: 1 }; $scope.flashMessage = "Appliance added.";
    };
    $scope.applianceItemUnits = function (a) { return a.watts * a.hours * a.quantity * 30 / 1000; };
    $scope.applianceItemCost = function (a) { return $scope.applianceItemUnits(a) * $scope.settings.tariff; };
    $scope.applianceUnits = function () { return $scope.appliances.reduce(function (s, a) { return s + $scope.applianceItemUnits(a); }, 0); };
    $scope.applianceCost = function () { return $scope.applianceUnits() * $scope.settings.tariff; };
    $scope.removeAppliance = function (id) { $scope.appliances = $scope.appliances.filter(function (a) { return a.id !== id; }); persist(); $scope.flashMessage = "Appliance removed."; };
    $scope.loadExamples = function () {
      var examples = [
        { name: "Ceiling fan", watts: 75, hours: 8, quantity: 2 },
        { name: "LED bulb", watts: 9, hours: 5, quantity: 5 },
        { name: "Television", watts: 100, hours: 4, quantity: 1 },
        { name: "Air conditioner", watts: 1500, hours: 4, quantity: 1 }
      ];
      examples.forEach(function (a, i) { a.id = Date.now() + i; });
      $scope.appliances = $scope.appliances.concat(examples); persist(); $scope.flashMessage = "Example appliances added.";
    };
    $scope.challengeCount = function () { return $scope.challengeDays.filter(Boolean).length; };
    $scope.saveChallenge = function () { persist(); };
    $scope.comparisonWidth = function (v) {
      var max = Math.max($scope.monthUnits(), $scope.previousMonthUnits(), 1);
      return Math.max(v > 0 ? 3 : 0, v / max * 100) + "%";
    };
    $scope.exportCSV = function () {
      if (!$scope.readings.length) { $scope.flashMessage = "There are no readings to export yet."; return; }
      var rows = [["Date", "Previous kWh", "Current kWh", "Units", "Estimated bill"]];
      $scope.readings.forEach(function (r) { rows.push([r.date, r.previous, r.current, r.units, r.bill]); });
      var csv = rows.map(function (row) { return row.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
      var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      var url = URL.createObjectURL(blob); var link = document.createElement("a");
      link.href = url; link.download = "wattwise-electricity-report.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      $scope.flashMessage = "CSV report exported.";
    };

    try {
      var savedEmail = localStorage.getItem(SESSION_KEY);
      if (savedEmail) {
        var savedUser = getUsers().find(function (u) { return u.email.toLowerCase() === savedEmail.toLowerCase(); });
        if (savedUser) { $scope.currentUser = { name: savedUser.name, email: savedUser.email }; loadUserData(); }
      }
    } catch (e) {}
  });
}());
