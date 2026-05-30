const fs = require('fs');
const path = 'RoadWatch.postman_collection.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

// Mapping of service name to correct port
const servicePortMap = {
  'Road Service': '3001',
  'Budget Service': '3002',
  'Complaint Service': '3003',
  'Document Service': '3004',
  'Search Service': '3005',
  'AI Gateway Service': '3006',
  'Auth Service': '3007',
  'Notification Service': '3008'
};

// Update each service's request URLs to correct ports
for (const service of data.item) {
  const targetPort = servicePortMap[service.name];
  if (!targetPort) continue;
  for (const req of service.item) {
    if (req.request && req.request.url) {
      // Update port field if needed
      if (req.request.url.port && req.request.url.port !== targetPort) {
        const oldPort = req.request.url.port;
        req.request.url.port = targetPort;
        if (req.request.url.raw) {
          req.request.url.raw = req.request.url.raw.replace(`:${oldPort}`, `:${targetPort}`);
        }
      }
      // Ensure raw URL contains correct port when raw is present but port field may be missing
      if (req.request.url.raw && !req.request.url.raw.includes(`:${targetPort}`)) {
        // replace any existing :#### pattern with correct port
        req.request.url.raw = req.request.url.raw.replace(/:\d{4}/, `:${targetPort}`);
      }
    }
  }
}

// Additional specific adjustments (e.g., change PATCH to PUT for Update Road)
const roadService = data.item.find(i => i.name === 'Road Service');
if (roadService) {
  const updateRoad = roadService.item.find(i => i.name === 'Update Road');
  if (updateRoad) {
    updateRoad.request.method = 'PUT';
  }
}

// Budget specific transformations (retain existing logic)
const budgetService = data.item.find(i => i.name === 'Budget Service');
if (budgetService) {
  const createBudget = budgetService.item.find(i => i.name === 'Create Budget');
  if (createBudget) {
    let rawBody = createBudget.request.body.raw;
    rawBody = rawBody.replace(/"123e4567-e89b-12d3-a456-426614174000"/g, '1');
    rawBody = rawBody.replace(/"123e4567-e89b-12d3-a456-426614174001"/g, '1');
    createBudget.request.body.raw = rawBody;
  }
  const updateExp = budgetService.item.find(i => i.name === 'Update Expenditure');
  if (updateExp) {
    updateExp.request.method = 'PUT';
  }
  const getByRoad = budgetService.item.find(i => i.name === 'Get Budget by Road');
  if (getByRoad) {
    getByRoad.request.url.raw = getByRoad.request.url.raw.replace('123e4567-e89b-12d3-a456-426614174000', '1');
    getByRoad.request.url.path = getByRoad.request.url.path.map(p => p === '123e4567-e89b-12d3-a456-426614174000' ? '1' : p);
  }
}

fs.writeFileSync(path, JSON.stringify(data, null, 4));
console.log('Postman collection updated successfully.');
