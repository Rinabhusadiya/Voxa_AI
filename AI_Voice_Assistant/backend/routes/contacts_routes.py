from typing import List, Optional
from fastapi import APIRouter, HTTPException
from ..models.schemas import ContactSchema

router = APIRouter(prefix="/api/contacts", tags=["Contacts"])

# Seed address book (supports offline web operation when not on Android device)
INITIAL_CONTACTS: List[ContactSchema] = [
    ContactSchema(id="c1", name="Mom", phone="+91 98765 43210", email="mom@family.local", is_favorite=True, relationship="Mother"),
    ContactSchema(id="c2", name="Rahul Sharma", phone="+91 98250 12345", email="rahul.sharma@example.com", is_favorite=True, relationship="Friend"),
    ContactSchema(id="c3", name="Dad", phone="+91 98765 43211", email="dad@family.local", is_favorite=True, relationship="Father"),
    ContactSchema(id="c4", name="Priya Patel", phone="+91 97240 88990", email="priya.p@tech.io", is_favorite=False, relationship="Colleague"),
    ContactSchema(id="c5", name="Dr. Mehta Clinic", phone="+91 94260 55443", email="care@mehtaclinic.com", is_favorite=False, relationship="Doctor"),
    ContactSchema(id="c6", name="Amit Verma", phone="+91 99090 77123", email="amit.v@startup.co", is_favorite=False, relationship="Partner"),
]

_contacts_db: List[ContactSchema] = list(INITIAL_CONTACTS)

@router.get("", response_model=List[ContactSchema])
async def list_contacts(search: Optional[str] = None):
    """Retrieve contacts list with optional search query."""
    if not search:
        return _contacts_db
    q = search.lower()
    return [c for c in _contacts_db if q in c.name.lower() or q in c.phone.replace(" ", "")]

@router.post("", response_model=ContactSchema)
async def add_contact(contact: ContactSchema):
    """Add a new contact to the address book."""
    for existing in _contacts_db:
        if existing.phone == contact.phone:
            raise HTTPException(status_code=400, detail="Contact with this phone number already exists")
    _contacts_db.append(contact)
    return contact

@router.put("/{contact_id}/favorite", response_model=ContactSchema)
async def toggle_favorite(contact_id: str):
    """Toggle favorite status of a contact."""
    for c in _contacts_db:
        if c.id == contact_id:
            c.is_favorite = not c.is_favorite
            return c
    raise HTTPException(status_code=404, detail="Contact not found")

@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact."""
    global _contacts_db
    initial_len = len(_contacts_db)
    _contacts_db = [c for c in _contacts_db if c.id != contact_id]
    if len(_contacts_db) == initial_len:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"message": "Contact deleted successfully"}
