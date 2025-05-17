# YOLOv8 Object Detection API on AWS

This project demonstrates a serverless object detection API using FastAPI and YOLOv8, deployed on AWS Lambda via a Docker container. It includes a simple HTML frontend hosted on S3.

## Features

- Upload an image via a browser
- YOLOv8 detects objects and returns an image with bounding boxes and tags
- Serverless backend using AWS Lambda + API Gateway
- Static frontend hosted on AWS S3
- Frontend also deployed to AWS Amplify for secure hosting
- GitHub Actions for CI/CD (build and push to ECR)

## Demo

To try it yourself, please refer to <a href="https://yolo.d3dzxb2du9m6mh.amplifyapp.com/" target="_blank">this page</a>.