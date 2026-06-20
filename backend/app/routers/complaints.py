import uuid
from datetime import UTC, datetime
from typing import Annotated

from app.database import get_db
from app.dependencies.auth_deps import (
    get_current_active_user,
    require_manager_or_above,
    require_staff_or_above,
)
from app.models.complaint import Complaint, TicketMessage
from app.models.user import User
from app.schemas.complaint import (
    ComplaintAssignRequest,
    ComplaintResponse,
    ComplaintStatusUpdate,
    ContactFormCreate,
    TicketCreate,
    TicketMessageCreate,
)
from app.services.email_service import EmailService
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

router = APIRouter(tags=["Complaints & Tickets"])


async def generate_ticket_number(db: AsyncSession) -> str:
    result = await db.execute(select(func.count(Complaint.id)))
    count = result.scalar() or 0
    seq = count + 1
    return f"TKT-{seq:06d}"


@router.post("/complaints/contact", status_code=status.HTTP_201_CREATED)
async def submit_contact_form(
    form_in: ContactFormCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    ticket_num = await generate_ticket_number(db)
    new_complaint = Complaint(
        ticket_number=ticket_num,
        user_id=None,
        order_id=form_in.order_id,
        submitter_name=form_in.submitter_name,
        submitter_email=form_in.submitter_email,
        submitter_phone=form_in.submitter_phone,
        subject=form_in.subject,
        message=form_in.message,
        category=form_in.category,
        status="open",
        priority="medium",
    )

    db.add(new_complaint)
    await db.commit()
    await db.refresh(new_complaint)

    background_tasks.add_task(
        EmailService.send_ticket_created_email,
        email=new_complaint.submitter_email,
        submitter_name=new_complaint.submitter_name,
        ticket_number=new_complaint.ticket_number,
        subject=new_complaint.subject,
    )

    return {
        "detail": "Ticket submitted successfully",
        "ticket_number": ticket_num,
    }


@router.get("/complaints/track-ticket")
async def track_guest_ticket(
    ticket_number: str = Query(...),
    email: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.messages))
        .where(
            Complaint.ticket_number == ticket_number,
            Complaint.submitter_email == email,
        )
    )
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(
            status_code=404, detail="Ticket not found or email mismatch"
        )

    complaint.messages = [m for m in complaint.messages if not m.is_internal]
    return complaint


@router.post(
    "/complaints/tickets",
    response_model=ComplaintResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_support_ticket(
    ticket_in: TicketCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    ticket_num = await generate_ticket_number(db)
    new_complaint = Complaint(
        ticket_number=ticket_num,
        user_id=current_user.id,
        order_id=ticket_in.order_id,
        submitter_name=current_user.full_name,
        submitter_email=current_user.email,
        submitter_phone=None,
        subject=ticket_in.subject,
        message=ticket_in.message,
        category=ticket_in.category,
        status="open",
        priority="medium",
    )

    db.add(new_complaint)
    await db.commit()
    await db.refresh(new_complaint, ["messages"])

    background_tasks.add_task(
        EmailService.send_ticket_created_email,
        email=new_complaint.submitter_email,
        submitter_name=new_complaint.submitter_name,
        ticket_number=new_complaint.ticket_number,
        subject=new_complaint.subject,
    )
    return new_complaint


@router.get("/complaints/my-tickets")
async def list_my_tickets(
    current_user: Annotated[User, Depends(get_current_active_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    query = (
        select(Complaint)
        .where(Complaint.user_id == current_user.id)
        .order_by(Complaint.created_at.desc())
    )

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))  # noqa: E501
    total = count_res.scalar() or 0

    result = await db.execute(
        query.options(selectinload(Complaint.messages)).offset(offset).limit(page_size)  # noqa: E501
    )
    complaints = result.scalars().all()

    for c in complaints:
        c.messages = [m for m in c.messages if not m.is_internal]

    total_pages = (total + page_size - 1) // page_size
    return {
        "items": complaints,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/complaints/my-tickets/{id}", response_model=ComplaintResponse)
async def get_my_ticket(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.messages))
        .where(Complaint.id == id, Complaint.user_id == current_user.id)
    )
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Ticket not found")

    complaint.messages = [m for m in complaint.messages if not m.is_internal]
    return complaint


@router.post(
    "/complaints/my-tickets/{id}/reply",
    response_model=ComplaintResponse,
)
async def reply_to_my_ticket(
    id: uuid.UUID,
    msg_in: TicketMessageCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.messages))
        .where(Complaint.id == id, Complaint.user_id == current_user.id)
    )
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Ticket not found")

    new_msg = TicketMessage(
        complaint_id=complaint.id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        message=msg_in.message,
        is_internal=False,
    )

    if complaint.status == "closed":
        complaint.status = "open"

    db.add(new_msg)
    await db.commit()
    await db.refresh(complaint)

    complaint.messages = [m for m in complaint.messages if not m.is_internal]
    return complaint


@router.get("/admin/complaints")
async def admin_list_complaints(
    current_user: Annotated[User, Depends(require_staff_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * page_size
    query = select(Complaint).order_by(Complaint.created_at.desc())

    if status:
        query = query.where(Complaint.status == status)
    if category:
        query = query.where(Complaint.category == category)
    if priority:
        query = query.where(Complaint.priority == priority)

    count_res = await db.execute(select(func.count()).select_from(query.subquery()))  # noqa: E501
    total = count_res.scalar() or 0

    result = await db.execute(
        query.options(selectinload(Complaint.messages)).offset(offset).limit(page_size)  # noqa: E501
    )
    complaints = result.scalars().all()

    total_pages = (total + page_size - 1) // page_size
    return {
        "items": complaints,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/admin/complaints/{id}", response_model=ComplaintResponse)
async def admin_get_complaint_detail(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(require_staff_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.messages))
        .where(Complaint.id == id)
    )
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint ticket not found",
        )
    return complaint


@router.post("/admin/complaints/{id}/reply", response_model=ComplaintResponse)
async def admin_reply_to_complaint(
    id: uuid.UUID,
    msg_in: TicketMessageCreate,
    current_user: Annotated[User, Depends(require_staff_or_above)],
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.messages))
        .where(Complaint.id == id)
    )
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint ticket not found",
        )

    new_msg = TicketMessage(
        complaint_id=complaint.id,
        sender_id=current_user.id,
        sender_name=current_user.full_name,
        message=msg_in.message,
        is_internal=msg_in.is_internal,
    )

    db.add(new_msg)
    await db.commit()
    await db.refresh(complaint)

    if not new_msg.is_internal:
        background_tasks.add_task(
            EmailService.send_ticket_reply_email,
            email=complaint.submitter_email,
            submitter_name=complaint.submitter_name,
            ticket_number=complaint.ticket_number,
            subject=complaint.subject,
            reply_text=new_msg.message,
        )

    return complaint


@router.patch(
    "/admin/complaints/{id}/status",
    response_model=ComplaintResponse,
)
async def admin_update_complaint_status(
    id: uuid.UUID,
    status_in: ComplaintStatusUpdate,
    current_user: Annotated[User, Depends(require_staff_or_above)],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.messages))
        .where(Complaint.id == id)
    )
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint ticket not found",
        )

    complaint.status = status_in.status
    if status_in.priority:
        complaint.priority = status_in.priority

    if status_in.status == "resolved" or status_in.status == "closed":
        complaint.resolved_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(complaint)
    return complaint


@router.patch(
    "/admin/complaints/{id}/assign",
    response_model=ComplaintResponse,
)
async def admin_assign_complaint(
    id: uuid.UUID,
    assign_req: ComplaintAssignRequest,
    manager: Annotated[User, Depends(require_manager_or_above)],
    db: AsyncSession = Depends(get_db),
):
    stf_res = await db.execute(select(User).where(User.id == assign_req.assigned_to))  # noqa: E501
    staff = stf_res.scalars().first()
    if not staff or staff.role not in ["superadmin", "manager", "staff"]:
        raise HTTPException(status_code=400, detail="Invalid staff member ID")

    result = await db.execute(
        select(Complaint)
        .options(selectinload(Complaint.messages))
        .where(Complaint.id == id)
    )
    complaint = result.scalars().first()
    if not complaint:
        raise HTTPException(
            status_code=404,
            detail="Complaint ticket not found",
        )

    complaint.assigned_to = assign_req.assigned_to
    await db.commit()
    await db.refresh(complaint)
    return complaint
