import React, { useState } from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import jsPDF from 'jspdf';

export function exportToCSV(data, filename, columns) {
  if (!data || data.length === 0) return;
  
  const headers = columns.map(c => c.header).join(',');
  const rows = data.map(row => 
    columns.map(c => {
      let value = c.accessor ? c.accessor(row) : row[c.key];
      if (value === null || value === undefined) value = '';
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  ).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}

export function exportToPDF(title, sections, filename) {
  const doc = new jsPDF();
  let yPos = 20;
  
  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 20, yPos);
  yPos += 10;
  
  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, yPos);
  yPos += 15;
  
  // Sections
  sections.forEach(section => {
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Section title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, 20, yPos);
    yPos += 8;
    
    // Section content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    if (section.type === 'summary') {
      section.items.forEach(item => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${item.label}: ${item.value}`, 25, yPos);
        yPos += 6;
      });
    } else if (section.type === 'table' && section.data) {
      const columns = section.columns || [];
      const data = section.data || [];
      
      // Table header
      let xPos = 20;
      doc.setFont('helvetica', 'bold');
      columns.forEach(col => {
        doc.text(col.header.substring(0, 15), xPos, yPos);
        xPos += col.width || 40;
      });
      yPos += 6;
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      data.slice(0, 20).forEach(row => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        xPos = 20;
        columns.forEach(col => {
          let value = col.accessor ? col.accessor(row) : row[col.key];
          if (value === null || value === undefined) value = '';
          doc.text(String(value).substring(0, 20), xPos, yPos);
          xPos += col.width || 40;
        });
        yPos += 5;
      });
      
      if (data.length > 20) {
        yPos += 3;
        doc.setFont('helvetica', 'italic');
        doc.text(`... and ${data.length - 20} more rows (see CSV export for full data)`, 25, yPos);
      }
    }
    
    yPos += 10;
  });
  
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export default function ReportExporter({ 
  title, 
  csvData, 
  csvColumns, 
  pdfSections, 
  filename 
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      exportToCSV(csvData, filename, csvColumns);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      exportToPDF(title, pdfSections, filename);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileDown className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}