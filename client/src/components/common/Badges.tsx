import React from 'react';

export const StatusBadge = ({ status }: { status: string }) => {
  let color = 'secondary';
  let icon = 'circle';
  let accessibleText = `Status: ${status}`;

  switch (status) {
    case 'NEW':
      color = 'info';
      icon = 'star-fill';
      break;
    case 'OPEN':
      color = 'primary';
      icon = 'envelope-open-fill';
      break;
    case 'IN_PROGRESS':
      color = 'warning text-dark';
      icon = 'gear-wide-connected';
      break;
    case 'WAITING_FOR_REQUESTER':
      color = 'secondary';
      icon = 'person-raised-hand';
      break;
    case 'RESOLVED':
      color = 'success';
      icon = 'check-circle-fill';
      break;
    case 'CLOSED':
      color = 'dark';
      icon = 'archive-fill';
      break;
    case 'REOPENED':
      color = 'danger';
      icon = 'arrow-counterclockwise';
      break;
    case 'CANCELLED':
      color = 'light text-dark border';
      icon = 'x-circle-fill';
      break;
  }

  return (
    <span className={`badge bg-${color}`} aria-label={accessibleText} title={accessibleText}>
      <i className={`bi bi-${icon} me-1`} aria-hidden="true"></i>
      {status}
    </span>
  );
};

export const PriorityBadge = ({ priority }: { priority: string }) => {
  let color = 'secondary';
  let icon = 'flag';
  let accessibleText = `Priority: ${priority}`;

  switch (priority) {
    case 'LOW':
      color = 'success';
      icon = 'arrow-down-short';
      break;
    case 'NORMAL':
      color = 'secondary';
      icon = 'dash';
      break;
    case 'HIGH':
      color = 'warning text-dark';
      icon = 'arrow-up-short';
      break;
    case 'URGENT':
      color = 'danger';
      icon = 'exclamation-triangle-fill';
      break;
  }

  return (
    <span className={`badge bg-${color}`} aria-label={accessibleText} title={accessibleText}>
      <i className={`bi bi-${icon} me-1`} aria-hidden="true"></i>
      {priority}
    </span>
  );
};
