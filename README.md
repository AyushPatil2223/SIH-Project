## Installation & Setup

```bash


# Setup backend
cd backend
python -m venv venv
# Windows
venv\Scripts\activate

pip install -r requirements.txt
To run backend:-
uvicorn app:app --reload --port 8000

exit from file.
cd..

# Setup frontend
cd frontend
npm install
npm start
