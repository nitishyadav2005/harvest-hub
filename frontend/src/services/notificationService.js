
import api from "./api";

const getLocalDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const getDateStatus = (date) => {
    if (!date) return null;

    const today = getLocalDate();

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = getLocalDate(tomorrowDate);

    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeek = getLocalDate(nextWeekDate);

    if (date < today) return "OVERDUE";
    if (date === today) return "DUE TODAY";
    if (date === tomorrow) return "TOMORROW";
    if (date <= nextWeek) return "UPCOMING";

    return null;
};

export const getNotifications = async () => {

    // Fetch farms
    const farmResponse = await api.get("/farms");
    const farms = farmResponse.data || [];

    // Fetch fields
    const fieldResponses = await Promise.all(
        farms.map(farm => api.get(`/farms/${farm.id}/fields`))
    );

    const fields = fieldResponses.flatMap(
        response => response.data || []
    );

    // Fetch operations
    const operationResponses = await Promise.all(
        fields.map(async field => {
            const response = await api.get(
                `/fields/${field.id}/operations`
            );

            return (response.data || []).map(operation => ({
                ...operation,
                fieldId: operation.fieldId ?? field.id,
                fieldName: field.name
            }));
        })
    );

    const operations = operationResponses.flat();

    // Fetch equipment
    const equipmentResponses = await Promise.all(
        farms.map(farm =>
            api.get(`/farms/${farm.id}/equipment`)
        )
    );

    const equipment = equipmentResponses.flatMap(
        response => response.data || []
    );

    // Fetch maintenance records with equipmentId preserved
    const maintenanceResponses = await Promise.all(
        equipment.map(async item => {
            const response = await api.get(
                `/equipment/${item.id}/maintenance`
            );

            return (response.data || []).map(record => ({
                ...record,
                equipmentId: record.equipmentId ?? item.id
            }));
        })
    );

    const maintenance = maintenanceResponses.flat();

    const notifications = [];

    // --------------------------------
    // Operation reminders
    // --------------------------------

    operations.forEach(operation => {
        const status = String(
            operation.status || "PLANNED"
        ).trim().toUpperCase();

        if (
            status === "COMPLETED" ||
            status === "CANCELLED" ||
            !operation.scheduledDate
        ) {
            return;
        }

        const dateStatus = getDateStatus(operation.scheduledDate);

        if (!dateStatus) return;

        notifications.push({
            id: `operation-${operation.id}`,
            category: "OPERATION",
            title: operation.title ||
                operation.operationType ||
                "Farm Operation",
            description: operation.fieldName
                ? `Field: ${operation.fieldName}`
                : "Scheduled farm activity",
            date: operation.scheduledDate,
            status: dateStatus,
            icon: "🌱"
        });
    });

    // --------------------------------
    // Maintenance reminders
    // --------------------------------

    maintenance.forEach(record => {
        const maintenanceStatus = String(
            record.status || ""
        ).trim().toUpperCase();

        // Never show completed maintenance
        if (
            maintenanceStatus === "COMPLETED" ||
            !record.scheduledDate
        ) {
            return;
        }

        const dateStatus = getDateStatus(record.scheduledDate);

        if (!dateStatus) return;

        const equipmentItem = equipment.find(
            item =>
                Number(item.id) === Number(record.equipmentId)
        );

        notifications.push({
            id: `maintenance-${record.id}`,
            category: "MAINTENANCE",
            title: record.maintenanceType ||
                "Equipment Maintenance",
            description: equipmentItem
                ? `Equipment: ${equipmentItem.name}`
                : "Equipment service reminder",
            date: record.scheduledDate,
            status: dateStatus,
            icon: "⚙️"
        });
    });

    // --------------------------------
    // Equipment next service date
    // Fallback only when no maintenance
    // record exists for that date
    // --------------------------------

    equipment.forEach(item => {
        if (!item.nextServiceDate) return;

        // Check whether a maintenance record already exists
        // for this equipment and next service date.
        // This includes COMPLETED records.
        const existingMaintenance = maintenance.some(record =>
            Number(record.equipmentId) === Number(item.id) &&
            record.scheduledDate === item.nextServiceDate
        );

        // Do not generate a duplicate or stale reminder
        // for an already recorded maintenance date.
        if (existingMaintenance) return;

        const dateStatus = getDateStatus(item.nextServiceDate);

        if (!dateStatus) return;

        notifications.push({
            id: `equipment-${item.id}`,
            category: "MAINTENANCE",
            title: "Scheduled Equipment Service",
            description: `Equipment: ${item.name}`,
            date: item.nextServiceDate,
            status: dateStatus,
            icon: "⚙️"
        });
    });

    // Sort notifications by date
    return notifications.sort((a, b) =>
        a.date.localeCompare(b.date)
    );
};
