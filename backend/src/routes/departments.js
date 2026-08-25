const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// HELPER: Generate department code
// ============================================================
function generateDepartmentCode(name) {
  // Generate a code from the department name
  const code = name
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9]/g, '') // Remove special characters
    .substring(0, 5); // Take first 5 characters
  
  // If code is too short, pad with random numbers
  if (code.length < 3) {
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEPT${random}`;
  }
  
  // Add random numbers to make it unique
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `${code}${random}`;
}

// ============================================================
// HELPER: Ensure unique code
// ============================================================
async function generateUniqueDepartmentCode(name) {
  let code = generateDepartmentCode(name);
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    const existing = await prisma.department.findUnique({
      where: { code: code },
    });
    
    if (!existing) {
      isUnique = true;
    } else {
      // Add random numbers to make it unique
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      code = `${code.substring(0, 5)}${random}`;
      attempts++;
    }
  }
  
  return code;
}

// ============================================================
// GET: Fetch all departments
// ============================================================
router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch departments' });
  }
});

// ============================================================
// POST: Create a new department
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name || name.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Department name is required' 
      });
    }

    // Check if department with same name already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { name: name.trim() },
    });

    if (existingDepartment) {
      return res.status(400).json({
        success: false,
        error: `Department "${name.trim()}" already exists`,
      });
    }

    // Generate unique department code
    const code = await generateUniqueDepartmentCode(name.trim());

    // Create department with generated code
    const department = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code,
        description: description || '',
        isActive: true,
      },
    });

    console.log(`✅ Department created: ${department.name} (${department.code})`);

    res.status(201).json({ 
      success: true, 
      data: department,
      message: `Department "${department.name}" created successfully`
    });
  } catch (error) {
    console.error('Error creating department:', error);
    
    // Handle unique constraint errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Department name or code already exists. Please use a different name.',
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create department' 
    });
  }
});

// ============================================================
// GET: Fetch a single department by ID
// ============================================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({
      where: { id },
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }
    
    res.json({ success: true, data: department });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch department' });
  }
});

// ============================================================
// PUT: Update a department
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
    });
    
    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }
    
    // Check if name is taken by another department
    if (name && name.trim() !== existingDepartment.name) {
      const nameTaken = await prisma.department.findUnique({
        where: { name: name.trim() },
      });
      
      if (nameTaken) {
        return res.status(400).json({
          success: false,
          error: `Department "${name.trim()}" already exists`,
        });
      }
    }
    
    // Update department
    const department = await prisma.department.update({
      where: { id },
      data: {
        name: name ? name.trim() : existingDepartment.name,
        description: description !== undefined ? description : existingDepartment.description,
        isActive: isActive !== undefined ? isActive : existingDepartment.isActive,
      },
    });
    
    console.log(`✅ Department updated: ${department.name}`);
    
    res.json({
      success: true,
      data: department,
      message: `Department "${department.name}" updated successfully`
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ success: false, error: 'Failed to update department' });
  }
});

// ============================================================
// DELETE: Delete a department
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if department exists
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        doctors: true,
        staffMembers: true,
        beds: true,
        rooms: true,
        appointments: true,
      },
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found',
      });
    }
    
    // Check if department has related records
    const hasRelatedRecords = 
      department.doctors.length > 0 ||
      department.staffMembers.length > 0 ||
      department.beds.length > 0 ||
      department.rooms.length > 0 ||
      department.appointments.length > 0;
    
    if (hasRelatedRecords) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete department because it has related records (doctors, staff, beds, rooms, or appointments)',
      });
    }
    
    // Delete department
    await prisma.department.delete({
      where: { id },
    });
    
    console.log(`✅ Department deleted: ${department.name}`);
    
    res.json({
      success: true,
      message: `Department "${department.name}" deleted successfully`,
      data: {
        id: department.id,
        name: department.name,
      },
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete department because it has related records',
      });
    }
    
    res.status(500).json({ success: false, error: 'Failed to delete department' });
  }
});

module.exports = router;