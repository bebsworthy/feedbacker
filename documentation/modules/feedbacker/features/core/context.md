# Feature: core

**Module**: feedbacker  
**Type**: Single-module feature  
**Created**: 2025-08-08  

## Description
Core implementation of the React component-level feedback library based on the specifications in documentation/modules/feedbacker/features.md. This feature implements the drop-in feedback system with local storage, component detection, minimizable modal, feedback manager, and export functionality.

## Source Specification
This feature is derived from: `documentation/modules/feedbacker/features.md`

## Key Components
- Floating Action Button (FAB) with expand actions
- React component detection and selection
- Minimizable feedback modal
- Feedback manager sidebar
- localStorage persistence
- Export functionality (markdown and ZIP formats)

## Context
Building a standalone React library that can be dropped into any React 18+ application to enable component-level feedback capture. The library focuses on being zero-config, local-first, and non-intrusive to the host application.