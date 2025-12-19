"""Enums for the Printing Marketplace platform."""

import enum


class UserRole(str, enum.Enum):
    CUSTOMER = "CUSTOMER"
    PRINTER = "PRINTER"


class JobState(str, enum.Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class BidStatus(str, enum.Enum):
    OPEN = "OPEN"
    ACCEPTED = "ACCEPTED"
    LOST = "LOST"


class ProductType(str, enum.Enum):
    LEAFLETS = "LEAFLETS"
    POSTERS = "POSTERS"
    BROCHURES = "BROCHURES"
    FLYERS = "FLYERS"
    BUSINESS_CARDS = "BUSINESS_CARDS"
    OTHER = "OTHER"

