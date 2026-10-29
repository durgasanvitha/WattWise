WATTWISE - ELECTRICITY USAGE TRACKER (ANGULARJS)

RUN
1. Extract this ZIP into a new folder.
2. Open the folder in VS Code.
3. Open index.html with Live Server (recommended) or a browser with internet access.
4. Register/login. The app uses browser localStorage; there is no backend.

IMPORTANT IF OLD VALUES STILL APPEAR
The browser remembers old readings for each login. After replacing the project, old browser data may remain.
- Open the app, press F12, select Application (Chrome) > Local Storage > the current page, and delete the WattWise data key for your account; or use a fresh browser profile.
- Sign in again and open Meter readings > Load demo readings to create sample readings dated this month and last month.
- Do not delete storage if you need to keep your saved real readings.

HOW CALCULATIONS WORK
- A reading period's units = current meter reading minus previous meter reading.
- Monthly usage totals the units for readings dated in the current calendar month.
- Estimated monthly bill = monthly usage x tariff (default sample tariff ₹6.50/unit).
- Potential savings is an illustrative 10% of estimated monthly bill, not guaranteed savings.
- Monthly budget compares estimated monthly bill against the budget you set.
- Reports & Goals compares current-month usage with previous-month usage and lets you track the 7-day challenge.

TROUBLESHOOTING
- If monthly usage is zero, make sure at least one reading date is in the current month and year.
- Date parsing supports YYYY-MM-DD and DD/MM/YYYY or DD-MM-YYYY.
- Use a recent browser and keep internet enabled for AngularJS CDN loading.

DEMO / SECURITY NOTE
This is an educational front-end demo. Login credentials and app data are stored in localStorage and are not secure. Do not use real passwords. It is not connected to a live electricity meter or utility provider.
