# Upright - Building healthier habits for Remote Professionals

## Welcome

Upright is an application that watches you while you work and ensures you are sitting correctly

By watching your posture, this application gently reminds you to sit up straight, preventing health issues like tech neck and rounded shoulders

## Why

As a remote professional myself, I work long hours at my desk and during times of intense focus I forget that I am sitting like a shrimp in my chair.
This Project aims to be a "slouch sentry" and bring awareness to your posture as you stay focused

## How

Using Roboflow Live Inference API, your computers local camera stream is sent real time to a Yolo26 Machine learning model which detects keypoints such as shoulders, ears, nose, etc.

These keypoints are used to determine if you are slouching using two heuristics

1. **Nose-Shoulder Height**: The distance between your nose and midpoint (average between your two shoulders) is used as a baseline. Major deviations equate to bad posture
2. **Ear-Shoulder Height**: The distance between your ear and corresponding shoulder are used to detect head tilt and major deviations equate to bad posture.

### Other Heuristics Used

1. Yolo26 Model returns a bounding box around the detected human, we measure the diagnol of this box and major deviations mean the user is too close or too far from the camera.

## The Future of Upright

My vision for this application is simple, there is no health platform for remote professionals.

I image a full suite of analytics, heuristics, and health tools that all run simultaneously while you work, such as:

1. **Posture** - Posture awareness as Upright includes today
2. **Water Consumption** - Monitoring how much water you drink and set goals and reminders for drinking water
3. **Distraction** - Monitor how much time you spend on your phone while working
4. **Movement** - How long are you sitting in one spot, its important to move around and do pushups, jumping jacks frequently since sitting is bad for the health

The posibilities are endless and an overall **Health Score** can determine how healthy you are as a remote profesional and the health effects from it. All with the
Goal of keeping remote professionals aware of their health and providing the steps to remediate these issues.

## Current Issues

1. Yolo26 Machine Learning sometimes returns multiple predictions in some frames so detecting multiple users is buggy because of this.
