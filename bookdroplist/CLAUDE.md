# Product Requirements Document: Book List Sharing Platform

## Overview
A web application that simplifies book sharing and discovery through categorized book lists, community interaction, and location-based connections.

## Core Features

### Book List Types
- **Share Lists**: Recommendation lists ("favorite books ever")
- **Free Lists**: Books available for pickup at no cost
- **Borrow Lists**: Books available for temporary lending
- **Selling Lists**: Books for purchase with escrow payments
- **Little Free Library Lists**: Inventory of local community book boxes

### List Creation
- **Photo-to-list conversion**: Use Gemini AI to automatically parse book photos into lists
- **Manual entry**: Search and add books via OpenLibrary API
- **Dead simple UX**: Minimal steps from idea to published list

### Location System
- Use local Little Free Libraries as reference points for Buy/Free/Borrow lists
- Users select "near [library name]" instead of addresses
- Integrates with Dutch minibieb.nl database when possible

### Community Features
- Simple comment threads per list and per Little Free Library location
- Basic messaging between users for book transactions
- Sponsored content integration in community discussions

### Authentication & Tech Stack
- Magic link authentication (no passwords)
- React + Tailwind CSS frontend
- Supabase backend
- Real-time updates for community features

## Business Model
- Premium features for power users
- Escrow payment system for book sales (transaction fees)
- Data insights for publishers/researchers
- Sponsored content in community discussions
- Partnership opportunities with local bookstores

## Success Metrics
- Number of active book lists
- User engagement in communities
- Successful book transactions (borrows/sales)
- Little Free Library network growth

## Key Principles
- Keep it stupid simple - minimize cognitive load
- Focus on connecting people, not cataloging books
- Support local book communities and physical bookstores
- Make list creation frictionless