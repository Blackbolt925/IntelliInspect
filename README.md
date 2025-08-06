# IntelliInspect - Real-Time Predictive Quality Control with Kaggle Instrumentation Data

Project work done for the ABB Hackathon.

## Team Members
- Gedela Sailaja (CS22B1013)
- Koppisetty Venkata Sai Siddharth (CS22B1022)
- Panchananam Lakshmi Srinivas (CS22B1040)
- Kaustub Pavagada (CS22B1042)

## Table of Contents
- [Setup Guide](#sdn-emulation-and-development-of-dataset-for-ml-based-intrusion-detection)
- [Usage Guide](#usage-guide)

## Objective
Design and implement a full-stack AI-powered application that enables real-time quality control prediction using Kaggle Production Line sensor data. 
  
![image]()

## Software Stack Used
- Frontend (UI) - **AngularJS**: for the entire user interface and statistics display
- Backend - **ASP.NET Core**: handles all core logic, API routing, and data orchestration between the frontend and the ML microservice. It manages file uploads, date range validations, model training requests, and streaming of row-wise data for real-time predictions.
- Microservice - **FastAPI**: contains the model training code, stores the trained model and returns predictions one-by-one during streaming

## Setup Guide

## Usage Guide
The usage guide will be page-by-page, ensuring the user can follow along easily
### Page 1: Upload file
- The first screen has an interface where the user must upload a CSV file. This is the dataset that will be used.
- Click on the "File Upload" button or drag and drop a CSV file into it.
- Upon successfull uploading, the screen will change to display some data about the file such as
  - No. of rows
  - No. of columns
  - Date range (augmented synthetically)
  - Percentage of 1-valued responses
## Page 2: Date Choosing
- The application now directs the user to choose three sets of dates:
  - Training start date, training end date
  - Testing start date, testing end date
  - Simulation start date, simulation end date
- These dates are the criteria upon which the CSV file (dataset) will be split to be used for training, testing and simulation respectively.
- The dates that are entered are validated to be within the date range of the file. Upon validation, the user will be displayed statistics about the spread of the three phases of data.
> [!NOTE]
> If the dates entered are out of range of the dataset, the user will be alerted to fix it. Only after validation will the rest of the page be displayed.
- Final date values are stored in the backend application.
## Page 3: Model Training
- Once the system has the CSV file and the date ranges, the model must be trained.
- This page has a simple "Train Model" button, which when clicked prompts the backend service to train the ML model in the microservice app.
- While training, a waiting message is displayed. After the model finishes training, the user can see various metrics that it provides including
  - Accuracy
  - Precision
  - Recall
  - F1 Score
  - Graphs showing training accuracy and training loss
  - Donut chart of the confusion matrix
- Once the user clicks next, the final part of the application is ready to be executed.
## Page 4: Simulation
- The final page contains a button to start simulation, click it to begin.
- The system gets the predictions of the model on each data point in the simulation range row-by-row, and displays statistics on it.
- Statistics like the prediction values and confidence are plotted on a graph and with each data point being added, the user can see real-time updates to the statistics.
- Along with this, the user can find a log of each row's data being perdicted upon, with the list increasing each second.
- After 30 predictions, the simulation stops and is ready to be restarted from the beginning.
