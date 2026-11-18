"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, RotateCw } from "lucide-react";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Buttons or links that get the user out of the empty state. */
  children?: ReactNode;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/** Nothing to show yet: says why, and what to do next. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  size = "default",
  className,
}: EmptyStateProps) {
  return (
    <Empty size={size} className={cn("mx-auto", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && <EmptyContent className="flex-row justify-center">{children}</EmptyContent>}
    </Empty>
  );
}

interface ErrorStateProps {
  title: string;
  /** The error itself; its message is shown as the cause. */
  error?: unknown;
  onRetry?: () => void;
  retrying?: boolean;
  /** Extra way out, e.g. a link back to a safe page. */
  children?: ReactNode;
  size?: "sm" | "default" | "lg";
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong.";
}

/** A failed load: what failed, why, and a retry. Announced to screen readers. */
export function ErrorState({
  title,
  error,
  onRetry,
  retrying = false,
  children,
  size = "default",
}: ErrorStateProps) {
  return (
    <Empty size={size} className="mx-auto" role="alert">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-destructive/10 text-destructive">
          <AlertCircle aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>
          {errorMessage(error)} Check your connection and try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center">
        {onRetry && (
          <Button onClick={onRetry} disabled={retrying}>
            {retrying ? (
              <Loader size="sm" className="text-current" aria-hidden="true" />
            ) : (
              <RotateCw aria-hidden="true" />
            )}
            {retrying ? "Retrying…" : "Try again"}
          </Button>
        )}
        {children}
      </EmptyContent>
    </Empty>
  );
}

/** A full-width table row that holds an empty or error state. */
export function TableStateRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell colSpan={colSpan} className="p-0">
        {children}
      </TableCell>
    </TableRow>
  );
}

/** Placeholder rows shaped like the real ones while data loads. */
export function TableSkeletonRows({
  rows,
  columns,
}: {
  rows: number;
  /** Tailwind width class for each column's bar. */
  columns: string[];
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, r) => (
        <TableRow key={r} aria-hidden="true" className="hover:bg-transparent">
          {columns.map((width, c) => (
            <TableCell key={c}>
              <Skeleton className={cn("h-4", width)} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
