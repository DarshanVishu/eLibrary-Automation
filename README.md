# eLibrary Test Automation Framework

![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)
![Maven](https://img.shields.io/badge/Maven-3.8%2B-C71A36?logo=apachemaven)
![REST Assured](https://img.shields.io/badge/REST_Assured-API_Testing-009688)
![TestNG](https://img.shields.io/badge/TestNG-7.x-red)
![CI/CD](https://img.shields.io/badge/GitHub_Actions-Automated-2088FF?logo=githubactions)

A modular, multi-role **Hybrid Test Automation Framework** engineered for the **eLibrary** digital library management platform (`eLibrary-Automation`)[cite: 2]. Built with **Java 17** and **Maven**, the framework delivers end-to-end UI and REST API test coverage across **Admin**, **Teacher**, and **Student** portals with clean Page Object Model (POM) isolation, TestNG listeners, and custom execution reporting[cite: 2].

---

## Key Highlights

- **Role-Based Page Object Architecture:** Dedicated page object layers for **Admin** (`pages.admin`), **Teacher** (`pages.teacher`), **Student** (`pages.student`), and shared navigation components (`pages.common`, `pages.base`)[cite: 2].
- **UI + API Hybrid Validation:** Combines backend REST API testing (`api.client`, `api.endpoints`, `api.models`) with UI functional and end-to-end workflows (`tests.e2e`)[cite: 2].
- **Granular Role-Specific Test Suites:** Separates test execution across authentication (`tests.auth`), administrative catalog/user controls (`tests.admin`), faculty workflows (`tests.teacher`), student borrowing/reading journeys (`tests.student`), and API contracts (`tests.api`)[cite: 2].
- **Execution Listeners & Reporting:** Integrated TestNG listeners (`com.elibrary.listeners`) and reporting utilities (`com.elibrary.reports`) for failure screenshots, execution logs, and test analytics[cite: 2].

---

## Project Architecture

```text
eLibrary-Automation/
├── docs/                                  # Framework & test documentation[cite: 2]
├── src/
│   ├── main/java/com/elibrary/
│   │   ├── api/
│   │   │   ├── client/                    # REST API HTTP client & base request specs[cite: 2]
│   │   │   ├── endpoints/                 # API route constants & endpoint definitions[cite: 2]
│   │   │   └── models/                    # Request/Response POJOs & serialization models[cite: 2]
│   │   ├── base/                          # Driver/browser lifecycle & core framework setup[cite: 2]
│   │   ├── config/                        # Environment & property configuration loaders[cite: 2]
│   │   ├── pages/
│   │   │   ├── admin/                     # Admin portal Page Objects[cite: 2]
│   │   │   ├── base/                      # BasePage shared actions & wait wrappers[cite: 2]
│   │   │   ├── common/                    # Shared headers, sidebars, modals & login pages[cite: 2]
│   │   │   ├── student/                   # Student portal Page Objects[cite: 2]
│   │   │   └── teacher/                   # Teacher portal Page Objects[cite: 2]
│   │   ├── reports/                       # Custom test reporting & dashboard generators[cite: 2]
│   │   └── utils/                         # Test data readers, file & helper utilities[cite: 2]
│   └── test/
│       ├── java/com/elibrary/
│       │   ├── listeners/                 # TestNG execution & failure capture listeners[cite: 2]
│       │   └── tests/
│       │       ├── admin/                 # Admin module functional tests[cite: 2]
│       │       ├── api/                   # REST API contract & negative validation tests[cite: 2]
│       │       ├── auth/                  # Login, logout & role-based access tests[cite: 2]
│       │       ├── base/                  # BaseTest setup & teardown hooks[cite: 2]
│       │       ├── e2e/                   # Cross-role end-to-end library workflows[cite: 2]
│       │       ├── student/               # Student catalog, issue/return & profile tests[cite: 2]
│       │       └── teacher/               # Teacher resource & academic portal tests[cite: 2]
│       └── resources/                     # TestNG XML suites & environment properties[cite: 2]
├── pom.xml                                # Maven dependencies & build configuration[cite: 2]
└── README.md

```

---

## Automated Test Coverage

* **Authentication & RBAC (`tests.auth`):** Multi-role login validation, session handling, and route protection across Admin, Teacher, and Student credentials.


* **Admin Portal (`tests.admin`):** Book/digital resource catalog management, category setup, user account provisioning, and circulation oversight.


* **Teacher Portal (`tests.teacher`):** Academic resource recommendations, reading list assignments, and faculty library interactions.


* **Student Portal (`tests.student`):** Digital catalog search/filtering, book reservation/borrowing flows, due-date tracking, and e-resource access.


* **REST API Suite (`tests.api`):** Endpoint status, schema, payload serialization, and authorization boundary validation.


* **End-to-End Workflows (`tests.e2e`):** Full cross-role journeys connecting Admin catalog publishing, Teacher assignment, and Student checkout/return.



---

## Prerequisites & Local Setup

* **Java JDK 17** (`JavaSE-17`) installed and configured in `JAVA_HOME`.


* **Apache Maven 3.8+** installed.

### Clone & Build

```bash
git clone [https://github.com/DarshanVishu/eLibrary-Automation.git](https://github.com/DarshanVishu/eLibrary-Automation.git)
cd eLibrary-Automation
mvn clean compile test-compile

```

---

## Running Tests Locally

### Run Full Regression Suite

```bash
mvn clean test

```

### Run Role-Specific or Layer-Specific Tests

```bash
# Run API tests only
mvn test -Dtest="com.elibrary.tests.api.*"

# Run Authentication tests
mvn test -Dtest="com.elibrary.tests.auth.*"

# Run Admin, Teacher, or Student suites
mvn test -Dtest="com.elibrary.tests.admin.*"
mvn test -Dtest="com.elibrary.tests.teacher.*"
mvn test -Dtest="com.elibrary.tests.student.*"

# Run End-to-End integration tests
mvn test -Dtest="com.elibrary.tests.e2e.*"

```

---

## Author

**Darshan Vishu** — QA Automation | Software Development Engineer in Test (SDET)

* GitHub: [@DarshanVishu](https://github.com/DarshanVishu)

```

```
