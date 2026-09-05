from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.models.user import UserRole


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    first_name: str
    last_name: str
    email: EmailStr
    role: UserRole
    is_active: bool

class LoginResponse(BaseModel):
    message: str
    user: UserResponse