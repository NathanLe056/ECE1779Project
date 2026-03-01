**ECE1779 Project Proposal: Tournament Bracket Tracker**

**Motivation**

Tournaments are a common way to organize competitions, whether in sports, gaming, classroom activities, or even casual rankings among friends. However, managing brackets and keeping participants updated is often inconvenient. Many available tools restrict access, require mandatory sign-ups, or hide important features behind paid plans. As a result, organizers spend unnecessary time dealing with technical limitations instead of focusing on running the event itself.

The motivation behind Tournament Tracker is to create a simple and open bracket management system that removes these barriers. The platform will allow users to generate brackets quickly, update match results without complexity, and share live progress through a direct link. Viewers should be able to access results without requiring an account.

This project is worth pursuing because it provides a universal solution that can serve different types of competitions. Instead of each event building its own custom system, Tournament Tracker can function as a shared platform that organizers integrate and distribute to participants. Its flexibility also allows it to be used beyond traditional tournaments, such as ranking favourite movies, fictional characters, or other head-to-head comparisons in a structured format.

The primary users of this system include event and league organizers who need a reliable way to manage competitions, as well as friend groups or online communities that want to track informal contests. By focusing on ease of use and accessibility, the platform ensures that both organizers and viewers have a smooth experience.

Although several bracket management tools already exist, they often limit visibility, require payment for advanced features, or restrict public sharing. Furthermore, current Tournament Trackers do not include the ability to interact with them through an API, which limits all users to utilize the website only. Tournament Tracker addresses these issues by prioritizing openness, simplicity, and easy sharing, making it practical for a wide range of users and events.

**Objective and Key Features**

The objective of Tournament Tracker is to design, implement, and deploy a full-stack web application that enables users to create, manage, and share tournament brackets in a scalable and reliable cloud environment. The system must support multiple tournament formats, enforce ranking validation rules, persist data securely, and allow real-time updates for viewers.

In addition to meeting the functional software requirements, the project aims to demonstrate practical knowledge of containerization, orchestration, cloud deployment, monitoring, CI/CD automation, and secure API design. The final deliverable will be a fully functional minimum viable product (MVP) with advanced features deployed in a production-like environment.

**Core Features**

**Bracket Management Functionality**

The system will allow users to:

- Create and delete brackets
- Specify bracket size (2, 4, 8, or 16 participants)
- Select tournament type (head-to-head, double elimination, round robin)
- Add participants with rankings and automatically place them into the bracket
- Validate rankings to prevent duplicates or invalid values
- Modify rankings before the tournament begins
- Enter match results until a final winner is declared
- Share brackets using a unique code
- Export bracket data in JSON or link format

These features satisfy the defined software requirements and ensure the application functions as a complete tournament tracking platform.

The project will use Kubernetes for container orchestration in production, with Docker Compose supporting local development. PostgreSQL will manage users, tournaments, brackets, participants, and match data, with Fly.io volumes ensuring persistent storage across restarts. The application will be deployed on Fly.io using Docker containers, including a Node.js backend and secure HTTPS access. Monitoring will be configured through Fly.io dashboards to track CPU, memory, and application activity, ensuring system reliability and performance visibility.

**Planned Advanced Features**

- WebSocket for real-time bracket updates
- Email notifications when results are updated or a winner is declared
- CI/CD pipeline using GitHub Actions for automated deployment
- Authentication and authorization so only creators can edit brackets

These advanced features extend beyond basic CRUD functionality and demonstrate implementation of real-time communication, automation, and security best practices.

**How These Features Fulfil Course Requirements**

The project integrates multiple required technical components:

- Full-stack development (frontend, backend, database)
- Containerization with Docker
- Orchestration using Kubernetes
- Cloud deployment on Fly.io
- Persistent storage with PostgreSQL volumes
- Monitoring and observability
- CI/CD automation
- Advanced features such as WebSocket and authentication

Together, these elements demonstrate practical application of distributed systems, DevOps practices, and scalable cloud architecture, aligning directly with the course objectives.

**Scope and Feasibility Within the Timeframe**

The project is structured into three one-week sprints. The first sprint focuses on database design, core CRUD endpoints, and a functional MVP. The second sprint introduces orchestration, authentication, CI/CD, and real-time updates. The third sprint finalizes monitoring, email notifications, export functionality, and frontend refinement.

Given the defined milestones, sprint structure, and incremental approach, the project is realistic and achievable within the three-week timeframe while still delivering both required and advanced functionality.

**Tentative plan**

The team plans to implement all the software requirements over the next few weeks through a series of 3 sprints, each lasting a week with specific milestones in each. The goal is to ensure that all of these milestones are met by creating git issues for specific requirements and have team members complete pull requests and have other team members review pull requests for functionality and clarity. This will essentially be a small version of a typical scrum development plan with the goal to create a minimum viable product as soon as possible. This allows time to implement the advanced features as soon as possible when the application is functional and testable.

**Team Member Responsibilities**

Each team member has been given specific areas to be in charge of so they can more heavily focus on these aspects of the app and keep ownership boundaries clear. The roles for each team member are:

- Alex - architecture, database, CI/CD
- Rahul - API endpoints, Front-end/GUI.
- Nathan - Fly.io, Kubernetes, Monitoring
- Harry - WebSockets, Authentication/security

Although there are clearly defined roles for each team member, to realistically complete the app in the short timeline, roles may be mixed, and tasks may be done based on who is available at the moment the task needs to be done.

**Week-by-Week Plan**

The current 3-week implementation plan is as follows:

March 1<sup>st</sup> - March 7<sup>th</sup>

- Complete database plan and implement in PostgreSQL.
- Implement minimum viable product.
  - CRUD endpoints functional, add, edit, delete, brackets
  - Create a tournament, pre-filled with placeholder people.
  - Set results for matchups.
  - Have that data persist in PostgreSQL database.
- Dockerize application/database so all developers can run it.

March 8<sup>th</sup> - March 14<sup>th</sup>

- Add more custom control to bracket.
  - Set number of people.
  - Add custom people/names with rankings.
- Setup Kubernetes
- Implement WebSockets for live updates on brackets
- Authentication/Authorization rules.
- Setup CI/CD pipeline for automatic deployment in GitHub.

March 15<sup>th</sup> - March 21<sup>st</sup>

- Monitoring metrics in Fly.io
- Email notifications for certain milestones in the bracket
  - Once a winner of the bracket has been declared.
  - Results of a specific matchup have been set.
- Front-end/GUI
- JSON/CSV exports for brackets

The remaining days before the presentation is due will be to wrap up any extra implementation work and prepare for the presentation.

**Initial Independent Reasoning**

First, Fly.io was chosen as it is a PaaS that offers simplicity for deploying Dockerized web applications and for leveraging its edge computing features. Next, Kubernetes will be integrated to manage our containerized applications since it provides superior automation that can handle more complexities beyond simple, single-host setups. Even though the product may assume a simple setup, the skills obtained from designing with this tool will become universal for the long-term. Furthermore, for persistent storage, PostgreSQL will be used as it is easily deployed in Docker as a good relational database that is stored in a Fly.io volume.

It is expected to face numerous challenges throughout the development cycle of this project. One of the main initial concerns is implementing WebSockets, since the app will run on multiple pods in Kubernetes. For example, if one user connects to Server A and an update happens on Server B, the user might not see it. It is imperative that all the servers communicate with each other properly, so the live scores stay in sync for all users.

The initial plan is to work in sprints with the "divide-and-conquer" strategy. A tentative plan has been laid out that lists goals and features to complete every week, and it is always possible to expand the list later.

**AI Assistance Disclosure**

In terms of development without AI assistance, the software requirements, basic features, motivation for producing this app, and a basic tentative plan for development have been discussed and planned. However, AI was used to suggest other project ideas to consider along with suggesting advanced features that can be implemented effectively into this tournament bracket tracker idea. For example, when AI was prompted about which advanced features should be implemented, it suggested implementing email notifications when the results of a bracket are updated and CI/CD pipeline with GitHub actions for automated deployments. Consequently, the utility of implementing each advanced feature from the list on the course website was discussed and compared along with the suggestions from AI, and it was determined that it would be most effective to follow the suggestions, since those features provide high utility for both developers and users.
