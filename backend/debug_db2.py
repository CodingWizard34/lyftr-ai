import os
import sys
import tempfile

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

_fd, _TEST_DB = tempfile.mkstemp(suffix=".db", prefix="lyftr_test_")
os.close(_fd)
_db_path = _TEST_DB.replace("\\", "/")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
print("DATABASE_URL env:", os.environ["DATABASE_URL"])

from app.config import DATABASE_URL as CFG_URL
print("Config DATABASE_URL:", CFG_URL)

from app.database import engine
print("Engine URL:", engine.url)

from app.database import create_db_and_tables
create_db_and_tables()
print("create_all done")

from sqlalchemy import inspect
insp = inspect(engine)
print("Tables:", insp.get_table_names())

import os as _os
if _os.path.exists(_TEST_DB):
    _os.remove(_TEST_DB)
