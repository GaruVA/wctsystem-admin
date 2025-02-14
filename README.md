## WCTSystem Admin

### Repository Overview
This repository contains the WCTSystem Admin project, written in TypeScript. It is a web application designed to help administrators manage waste disposal efficiently by providing real-time information about smart waste bins.

### Installation
1. **Clone the repository:**
    ```sh
    git clone https://github.com/GaruVA/wctsystem-admin.git
    cd wctsystem-admin
    ```

2. **Install the dependencies:**
    ```sh
    npm install
    ```

### Usage
To start the project, run:
```sh
npm run dev
```
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Developer Guidelines
#### Project Structure
- `app/`: Contains all the source code.
  - `components/`: Reusable React components.
  - `pages/`: Different pages of the application.
  - `services/`: Services for API calls using Axios.
  - `app/page.tsx`: Main entry point for the application.

#### Running the Backend
Ensure that the backend Node.js server is running. Follow the instructions in the [backend README](https://github.com/GaruVA/wctsystem-backend/blob/master/README.md).

#### Development Setup
1. **API Endpoints**: Define API endpoints in the backend and access them using Axios in the frontend.
2. **Using Axios**: Axios is a promise-based HTTP client for the browser and Node.js.
    - **Installation**: Axios is already included in the dependencies.
    - **Usage Example**:
      ```typescript
      import axios from 'axios';
      const fetchData = async () => {
        try {
          const response = await axios.get('http://localhost:5000/api/bins');
          console.log(response.data);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      ```

### Progress
- The Next.js app has been initialized with some dependencies and configurations.
```` ▋
