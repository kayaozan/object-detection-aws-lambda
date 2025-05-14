FROM public.ecr.aws/lambda/python:3.9

RUN apt-get update && apt-get install -y libgl1 libglib2.0-0

WORKDIR /var/task

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY main.py .

CMD ["main.handler"]