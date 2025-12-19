# Models

This directory contains the core domain models for the Printing Marketplace platform.

## Structure

Each model is in its own file:
- `user.py` - User model
- `customer_profile.py` - CustomerProfile model
- `printer_profile.py` - PrinterProfile model
- `printing_job.py` - PrintingJob model
- `bid.py` - Bid model
- `agreement.py` - Agreement model
- `rating.py` - Rating model

**Note:** Enums are located in `app/utils/enums.py` (UserRole, JobState, BidStatus, ProductType)

## ID Fields

Each model has:
- **id**: Auto-incrementing integer primary key (for database relationships)
- **uuid**: Unique UUID field (for external API references)

## Enums

Enums are located in `app/utils/enums.py`:
- `UserRole`: CUSTOMER, PRINTER
- `JobState`: DRAFT, OPEN, CLOSED, IN_PROGRESS, COMPLETED
- `BidStatus`: OPEN, ACCEPTED, LOST
- `ProductType`: LEAFLETS, POSTERS, BROCHURES, FLYERS, BUSINESS_CARDS, OTHER

Enums are stored as strings in the database (not SQL ENUM types) for flexibility:
- Python enums are used in application code
- Enum values are stored as strings in database columns
- This allows easier enum modifications without database migrations

## Entities

### User & Profiles
- **User**: Base user entity with role (CUSTOMER or PRINTER)
- **CustomerProfile**: Customer-specific profile information
- **PrinterProfile**: Printer business profile with capabilities, service areas, and payment terms

### Printing Jobs
- **PrintingJob**: Represents a printing job with state machine (DRAFT → OPEN → CLOSED → IN_PROGRESS → COMPLETED)
  - Product types: LEAFLETS, POSTERS, BROCHURES, FLYERS, BUSINESS_CARDS, OTHER
  - Includes bidding duration, due dates, and delivery preferences

### Bidding
- **Bid**: Printer's bid on a job
  - Status: OPEN, ACCEPTED, LOST
  - Includes price, turnaround time, and payment terms

### Agreements
- **Agreement**: Immutable record of accepted bid with payment terms confirmation
  - Created when customer accepts a bid
  - Records confirmation timestamp

### Ratings (Optional)
- **Rating**: Customer feedback on completed jobs
  - 1-5 star rating
  - Optional text feedback

## Relationships

```
User
├── CustomerProfile (1:1)
├── PrinterProfile (1:1)
├── PrintingJob[] (1:many, as customer)
└── Bid[] (1:many, as printer)

PrintingJob
├── Customer (many:1)
├── Bid[] (1:many)
└── Agreement (1:1, if accepted)

Bid
├── Job (many:1)
├── Printer (many:1)
└── Agreement (1:1, if accepted)

PrinterProfile
└── Rating[] (1:many)
```


## Constraints

- One customer profile per user
- One printer profile per user
- One bid per printer per job (enforced at application level)
- One agreement per job
- One rating per job
- Quantity, price, and turnaround must be positive
- Rating must be between 1-5

## ID Fields

All models use a dual-ID system:
- **id** (Integer): Auto-incrementing primary key for efficient database joins
- **uuid** (UUID): Unique identifier for external API references and public-facing endpoints

This approach provides:
- Fast database operations with integer foreign keys
- Secure, non-sequential public identifiers
- Best of both worlds for internal and external use

## Database Migrations

Migrations are managed by Alembic. The initial schema is in:
- `alembic/versions/001_initial_schema.py`

To create a new migration:
```bash
alembic revision --autogenerate -m "description"
```

To apply migrations:
```bash
alembic upgrade head
```

