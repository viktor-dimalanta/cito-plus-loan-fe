import { useEffect, useState } from "react";
import { Card, CardContent, Typography, Button, TextField, Dialog, DialogActions, DialogContent, DialogTitle,Select,MenuItem } from "@mui/material";
import { Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { v4 as uuidv4 } from "uuid";

export default function LoanSummary() {
  const [loanData, setLoanData] = useState([]);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formData, setFormData] = useState({
    id: "",
    applicantName: "",
    requestedAmount: "",
    status: "",
  });
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/loans")
      .then((response) => response.json())
      .then((data) => setLoanData(data))
      .catch((error) => console.error("Error fetching loan data:", error));
  }, []);

  const handleOpen = (loan = null) => {
    if (loan) {
      setEditMode(true);
      setFormData(loan);
    } else {
      setEditMode(false);
      setFormData({ id: "", applicantName: "", requestedAmount: "", status: "" });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    console.log(formData)
    if (editMode) {
      await fetch(`http://localhost:5000/loans/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } else {
      await fetch("http://localhost:5000/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, id: uuidv4() }),
      });
    }
    fetch("http://localhost:5000/loans")
      .then((response) => response.json())
      .then((data) => setLoanData(data));
    handleClose();
  };

  const handleDeleteConfirm = (id) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await fetch(`http://localhost:5000/loans/${deleteId}`, { method: "DELETE" });
      fetch("http://localhost:5000/loans")
        .then((response) => response.json())
        .then((data) => setLoanData(data));
    }
    setConfirmOpen(false);
  };

  const summary = loanData.reduce((acc, loan) => {
    if (!acc[loan.status]) {
      acc[loan.status] = { count: 0, total: 0 };
    }
    acc[loan.status].count += 1;
    acc[loan.status].total += parseFloat(loan.requestedAmount);
    return acc;
  }, {});

  const chartData = Object.keys(summary).map((status) => ({
    status,
    count: summary[status].count,
    total: summary[status].total,
  }));

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <Typography variant="h4" gutterBottom>
        Loan Applications Summary
      </Typography>
      <Button variant="contained" color="primary" onClick={() => handleOpen()}>Add Loan</Button>
      <Card>
        <CardContent>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Applicant</strong></TableCell>
                <TableCell><strong>Requested Amount</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loanData.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.applicantName}</TableCell>
                  <TableCell>${loan.requestedAmount.toLocaleString()}</TableCell>
                  <TableCell>{loan.status}</TableCell>
                  <TableCell>
                    <Button color="primary" onClick={() => handleOpen(loan)}>Edit</Button>
                    <Button color="secondary" onClick={() => handleDeleteConfirm(loan.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Loan Distribution
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" name="Number of Loans" />
              <Bar dataKey="total" fill="#8884d8" name="Total Value" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editMode ? "Edit Loan" : "Add Loan"}</DialogTitle>
        <DialogContent>
          <TextField label="Applicant Name" name="applicantName" fullWidth margin="dense" value={formData.applicantName} onChange={handleChange} />
          <TextField label="Requested Amount" name="requestedAmount" type="number" fullWidth margin="dense" value={formData.requestedAmount} onChange={handleChange} />
          <Select label="Status" name="status" fullWidth margin="dense" value={formData.status} onChange={handleChange}>
            <MenuItem value="APPROVED">APPROVED</MenuItem>
            <MenuItem value="PENDING">PENDING</MenuItem>
            <MenuItem value="CANCELLED">CANCELLED</MenuItem>
          </Select>
 
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">{editMode ? "Update" : "Add"}</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this loan?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="secondary">Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
