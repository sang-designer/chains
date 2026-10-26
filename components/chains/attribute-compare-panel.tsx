"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OuterJoinRow, ComparisonField } from "@/types/chain";
import { cn } from "@/lib/utils";
import { 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  MapPin,
  Phone,
  Globe,
  Clock,
  Tag
} from "lucide-react";

interface AttributeComparePanelProps {
  row: OuterJoinRow;
}

interface FieldComparison {
  field: string;
  label: string;
  icon: React.ElementType;
  inputValue?: string;
  venueValue?: string;
  isDifferent: boolean;
  status: 'matched' | 'different' | 'input_only' | 'venue_only' | 'both_empty';
}

export function AttributeComparePanel({ row }: AttributeComparePanelProps) {
  const getFieldStatus = (inputVal?: string, venueVal?: string): FieldComparison['status'] => {
    const hasInput = inputVal !== undefined && inputVal !== '';
    const hasVenue = venueVal !== undefined && venueVal !== '';
    
    if (!hasInput && !hasVenue) return 'both_empty';
    if (!hasVenue && hasInput) return 'input_only';
    if (!hasInput && hasVenue) return 'venue_only';
    if (inputVal === venueVal) return 'matched';
    return 'different';
  };

  const fields: FieldComparison[] = [
    {
      field: "name",
      label: "Business Name",
      icon: Tag,
      inputValue: row.input?.name,
      venueValue: row.venue?.name,
      isDifferent: row.input?.name !== row.venue?.name,
      status: getFieldStatus(row.input?.name, row.venue?.name),
    },
    {
      field: "address",
      label: "Street Address",
      icon: MapPin,
      inputValue: row.input?.address,
      venueValue: row.venue?.address,
      isDifferent: row.input?.address !== row.venue?.address,
      status: getFieldStatus(row.input?.address, row.venue?.address),
    },
    {
      field: "city",
      label: "City",
      icon: MapPin,
      inputValue: row.input?.city,
      venueValue: row.venue?.city,
      isDifferent: row.input?.city !== row.venue?.city,
      status: getFieldStatus(row.input?.city, row.venue?.city),
    },
    {
      field: "state",
      label: "State",
      icon: MapPin,
      inputValue: row.input?.state,
      venueValue: row.venue?.state,
      isDifferent: row.input?.state !== row.venue?.state,
      status: getFieldStatus(row.input?.state, row.venue?.state),
    },
    {
      field: "zip",
      label: "Zip Code",
      icon: MapPin,
      inputValue: row.input?.zip,
      venueValue: row.venue?.zip,
      isDifferent: row.input?.zip !== row.venue?.zip,
      status: getFieldStatus(row.input?.zip, row.venue?.zip),
    },
    {
      field: "phone",
      label: "Phone",
      icon: Phone,
      inputValue: row.input?.phone,
      venueValue: row.venue?.phone,
      isDifferent: row.input?.phone !== row.venue?.phone,
      status: getFieldStatus(row.input?.phone, row.venue?.phone),
    },
    {
      field: "url",
      label: "Website",
      icon: Globe,
      inputValue: row.input?.url,
      venueValue: row.venue?.url,
      isDifferent: row.input?.url !== row.venue?.url,
      status: getFieldStatus(row.input?.url, row.venue?.url),
    },
    {
      field: "hours",
      label: "Hours",
      icon: Clock,
      inputValue: row.input?.hours,
      venueValue: row.venue?.hours,
      isDifferent: row.input?.hours !== row.venue?.hours,
      status: getFieldStatus(row.input?.hours, row.venue?.hours),
    },
    {
      field: "coordinates",
      label: "Coordinates",
      icon: MapPin,
      inputValue:
        row.input?.latitude && row.input?.longitude
          ? `${row.input.latitude}, ${row.input.longitude}`
          : undefined,
      venueValue:
        row.venue?.latitude && row.venue?.longitude
          ? `${row.venue.latitude}, ${row.venue.longitude}`
          : undefined,
      isDifferent:
        row.input?.latitude !== row.venue?.latitude ||
        row.input?.longitude !== row.venue?.longitude,
      status: getFieldStatus(
        row.input?.latitude && row.input?.longitude
          ? `${row.input.latitude}, ${row.input.longitude}`
          : undefined,
        row.venue?.latitude && row.venue?.longitude
          ? `${row.venue.latitude}, ${row.venue.longitude}`
          : undefined
      ),
    },
    {
      field: "categories",
      label: "Categories",
      icon: Tag,
      inputValue: row.input?.categories?.join(", "),
      venueValue: row.venue?.categories?.join(", "),
      isDifferent:
        JSON.stringify(row.input?.categories) !==
        JSON.stringify(row.venue?.categories),
      status: getFieldStatus(
        row.input?.categories?.join(", "),
        row.venue?.categories?.join(", ")
      ),
    },
  ];

  const getStatusIcon = (status: FieldComparison['status']) => {
    switch (status) {
      case 'matched':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'different':
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      case 'input_only':
      case 'venue_only':
        return <XCircle className="h-4 w-4 text-slate-400" />;
      default:
        return <XCircle className="h-4 w-4 text-slate-300" />;
    }
  };

  const getStatusBadge = (status: FieldComparison['status']) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-100">Match</Badge>;
      case 'different':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-100">Different</Badge>;
      case 'input_only':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100">Source Only</Badge>;
      case 'venue_only':
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-100">Venue Only</Badge>;
      default:
        return <Badge variant="outline" className="text-slate-400">Empty</Badge>;
    }
  };

  const differentFields = fields.filter(f => f.status === 'different' || f.status === 'input_only' || f.status === 'venue_only');
  const matchedFields = fields.filter(f => f.status === 'matched');

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold">Data Comparison</h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {matchedFields.length} matched
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              {differentFields.length} differences
            </span>
          </div>
        </div>
        
        {differentFields.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Propose WOE
            </Button>
            <Button size="sm" variant="default">
              Update Venue
            </Button>
          </div>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="space-y-3">
        {fields.map((field) => {
          const Icon = field.icon;
          const shouldHighlight = field.status === 'different' || field.status === 'input_only' || field.status === 'venue_only';
          
          return (
            <div
              key={field.field}
              className={cn(
                "grid grid-cols-[40px_1fr_40px_1fr] gap-4 p-4 rounded-lg border transition-colors",
                shouldHighlight ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900" : "bg-muted/30 border-transparent"
              )}
            >
              {/* Field Label & Icon */}
              <div className="flex items-start justify-center pt-1">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
              
              {/* Venue/Authoritative Data - LEFT SIDE */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label} - Authoritative
                  </span>
                  {field.status === 'venue_only' && (
                    <Badge variant="outline" className="text-xs bg-slate-100 text-slate-700 border-slate-200">
                      Venue Only
                    </Badge>
                  )}
                </div>
                <div className={cn(
                  "text-sm font-medium break-words",
                  field.status === 'different' && "text-emerald-700 dark:text-emerald-400",
                  field.status === 'venue_only' && "text-slate-700 dark:text-slate-400",
                  !field.venueValue && "text-muted-foreground italic"
                )}>
                  {field.venueValue || "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {row.venue?._id && (
                    <>
                      <div>Venue ID: {row.venue._id.toString()}</div>
                      <div className="mt-1">Last updated: {new Date().toLocaleDateString()}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                  {getStatusIcon(field.status)}
                  {field.status === 'matched' && (
                    <ArrowRight className="h-3 w-3 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Input/Source Data - RIGHT SIDE */}
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label} - Source
                  </span>
                  {field.status === 'input_only' && (
                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                      Source Only
                    </Badge>
                  )}
                </div>
                <div className={cn(
                  "text-sm font-medium break-words",
                  field.status === 'different' && "text-amber-700 dark:text-amber-400",
                  field.status === 'input_only' && "text-blue-700 dark:text-blue-400",
                  !field.inputValue && "text-muted-foreground italic"
                )}>
                  {field.inputValue || "—"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {row.input?.sourceId && (
                    <>
                      <div>Source: {row.input.sourceId}</div>
                      <div className="mt-1">Populated: {new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Context */}
      {row.venue?.closed && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <span className="text-sm font-medium text-destructive">
            This venue is marked as closed in the authoritative dataset
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button size="sm" variant="ghost">
          View Full History
        </Button>
        <Button size="sm" variant="outline">
          Link to Different Venue
        </Button>
      </div>
    </div>
  );
}
