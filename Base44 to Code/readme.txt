## 📘 Base44 Sandbox File Extraction Guide

### 🎯 Purpose

This guide explains how to locate and capture sandbox file data from Base44 using browser developer tools. These steps support extracting application assets for local processing or automation workflows.

---

### 🛠️ Prerequisites

Ensure the following before proceeding:

* Access to your Base44 application
* A modern web browser such as Chrome, Edge, or Firefox
* Developer Tools enabled in your browser

---

### 🚀 Step-by-Step Instructions

#### 1️⃣ Open Your Base44 Application

1. Navigate to Base44 and sign in.
2. Open the specific application you want to extract files from.

---

#### 2️⃣ Open Developer Tools

1. Press **F12**
   OR
2. Right click anywhere on the page and select **Inspect**

---

#### 3️⃣ Disable Cache

1. In Developer Tools, navigate to the **Network** tab.
2. Locate and enable the checkbox labeled **Disable cache**.
3. Keep Developer Tools open. Cache disabling only works while it remains open.

---

#### 4️⃣ Reload the Base44 Page

1. Refresh the page using:

   * **Ctrl + R**
     OR
   * Browser refresh button

This forces the browser to reload all network resources without cached data.

---

#### 5️⃣ Locate the Required API Request

1. Stay in the **Network** tab.
2. Use the filter or search bar and look for requests matching:

```
files
```

---

#### 6️⃣ Inspect the Request

1. Click the matching request entry.
2. Open the **Response** or **Preview** tab.
3. Locate the returned file object data.

---

### 📦 Next Steps

You can now:

* Copy the response payload
* Save it as JSON or another structured format
* Process it using your extraction or automation scripts

---

### 💡 Best Practices

✅ Keep Developer Tools open while refreshing
✅ Confirm cache is disabled before reload
✅ Verify the correct application ID
✅ Save raw response data before modifying it

---

### 🔐 Security Reminder

Handle extracted data responsibly. Avoid sharing sensitive application assets or credentials.