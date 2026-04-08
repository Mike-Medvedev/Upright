# Upright - Building healthier habits for Remote Professionals

## Welcome

Upright is an application that watches you while you work at your desk and makes sure you're healthy.

By watching your posture, hydration and break frequency, this application gently reminds you to sit up straight and drink more water

## Why

Because our mind and bodies are way more important than our work, you can't have one without the other.

## How to run this locally

1. Clone this repo into your computer

```
git clone https://github.com/Mike-Medvedev/Upright.git
cd Upright
npm start
```

This will create a .env with the correct vars and start the frontend and backend all in one shot
**_Remember to enter your actual Roboflow API key!_**

## How to Run the frontend and backend seperately

1. Make a .env file and replace the roboflow key with your actual api key

```
echo -e "ROBOFLOW_API_KEY=1234\nPORT=3000" > .env
```

1. Frontend

```
cd frontend && npm run dev
```

Navigate to localhost:5173 to view the application

1. Backend

```
cd backend && npm run dev
```

Starts the backend at localhost:3000
