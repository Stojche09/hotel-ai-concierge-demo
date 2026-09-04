const API_BASE =
    "https://hotel-ai-backend-production.up.railway.app";

const HOTEL_CONFIG = {
    makpetrol: {
        name: "Hotel Makpetrol"
    },
    belica: {
        name: "Hotel Belica"
    }
};

let allBookings = [];
let allRooms = [];
let editId = null;
let editRoomNumber = null;


function getHotelId() {

    const params = new URLSearchParams(
        window.location.search
    );

    const hotelFromUrl = (
        params.get("hotel") ||
        params.get("hotel_id") ||
        "makpetrol"
    )
        .trim()
        .toLowerCase();

    if (HOTEL_CONFIG[hotelFromUrl]) {
        return hotelFromUrl;
    }

    return "makpetrol";
}


let currentHotelId = getHotelId();


function getHotelName() {

    return (
        HOTEL_CONFIG[currentHotelId]?.name ||
        currentHotelId
    );
}


function buildApiUrl(path) {

    const separator = path.includes("?")
        ? "&"
        : "?";

    return (
        `${API_BASE}${path}` +
        `${separator}hotel_id=` +
        `${encodeURIComponent(currentHotelId)}`
    );
}


function updateHotelUI() {

    const hotelName = getHotelName();

    const title =
        document.getElementById(
            "hotelDashboardTitle"
        );

    const subtitle =
        document.getElementById(
            "hotelDashboardSubtitle"
        );

    const selector =
        document.getElementById(
            "hotelSelector"
        );

    const sidebarHotelName =
        document.getElementById(
            "sidebarHotelName"
        );

    if (title) {

        title.textContent =
            `${hotelName} Admin Dashboard`;
    }

    if (subtitle) {

        subtitle.textContent =
            `Manage rooms, reservations and operations for ${hotelName}.`;
    }

    if (selector) {

        selector.value =
            currentHotelId;
    }

    if (sidebarHotelName) {

        sidebarHotelName.textContent =
            hotelName;
    }

    document.title =
        `${hotelName} Admin Dashboard`;
}


function changeHotel(hotelId) {

    if (!HOTEL_CONFIG[hotelId]) {
        return;
    }

    const url = new URL(
        window.location.href
    );

    url.searchParams.set(
        "hotel",
        hotelId
    );

    window.location.href =
        url.toString();
}


async function loadBookings() {

    try {

        const response = await fetch(
            buildApiUrl(
                "/admin/bookings"
            )
        );

        if (!response.ok) {

            throw new Error(
                `Bookings request failed: ${response.status}`
            );
        }

        const data =
            await response.json();

        console.log(
            "Bookings API response:",
            data
        );

        if (!Array.isArray(data.bookings)) {

            throw new Error(
                "data.bookings is not an array"
            );
        }

        allBookings =
            data.bookings;

        document.getElementById(
            "totalBookings"
        ).textContent =
            allBookings.length;

        let totalGuests = 0;

        allBookings.forEach(
            booking => {

                const guests =
                    Number(
                        booking.guests
                    );

                if (!isNaN(guests)) {

                    totalGuests +=
                        guests;
                }
            }
        );

        document.getElementById(
            "totalGuests"
        ).textContent =
            totalGuests;

        renderBookings(
            allBookings
        );

    } catch (error) {

        console.error(
            "Failed to load bookings:",
            error
        );

        allBookings = [];

        document.getElementById(
            "totalBookings"
        ).textContent = "0";

        document.getElementById(
            "totalGuests"
        ).textContent = "0";

        renderBookings([]);
    }
}


async function loadRooms() {

    try {

        const response = await fetch(
            buildApiUrl(
                "/admin/rooms"
            )
        );

        if (!response.ok) {

            throw new Error(
                `Rooms request failed: ${response.status}`
            );
        }

        const data =
            await response.json();

        allRooms =
            Array.isArray(data.rooms)
                ? data.rooms
                : [];

        const totalRooms =
            allRooms.length;

        const availableRooms =
            allRooms.filter(
                room =>
                    room.status ===
                    "Available"
            ).length;

        const occupiedRooms =
            allRooms.filter(
                room =>
                    room.status ===
                    "Occupied"
            ).length;

        const cleaningRooms =
            allRooms.filter(
                room =>
                    room.status ===
                    "Cleaning"
            ).length;

        const maintenanceRooms =
            allRooms.filter(
                room =>
                    room.status ===
                    "Maintenance"
            ).length;

        document.getElementById(
            "totalRooms"
        ).textContent =
            totalRooms;

        document.getElementById(
            "availableRooms"
        ).textContent =
            availableRooms;

        document.getElementById(
            "occupiedRooms"
        ).textContent =
            occupiedRooms;

        document.getElementById(
            "cleaningRooms"
        ).textContent =
            cleaningRooms;

        document.getElementById(
            "maintenanceRooms"
        ).textContent =
            maintenanceRooms;

        const roomsBody =
            document.getElementById(
                "roomsBody"
            );

        roomsBody.innerHTML = "";

        allRooms.forEach(room => {

            roomsBody.innerHTML += `
                <tr>

                    <td>
                        ${room.room_number}
                    </td>

                    <td>
                        ${room.type}
                    </td>

                    <td>
                        ${room.view}
                    </td>

                    <td>

                        <span
                            class="room-status ${getRoomStatusClass(room.status)}"
                        >
                            ${room.status}
                        </span>

                    </td>

                    <td>

                        <button
                            onclick="editRoom('${room.room_number}')"
                        >
                            Edit
                        </button>

                    </td>

                </tr>
            `;
        });

    } catch (error) {

        console.error(
            "Failed to load rooms:",
            error
        );

        allRooms = [];
    }
}


function getRoomStatusClass(status) {

    switch (status) {

        case "Available":
            return "room-available";

        case "Occupied":
            return "room-occupied";

        case "Cleaning":
            return "room-cleaning";

        case "Maintenance":
            return "room-maintenance";

        default:
            return "";
    }
}


function renderBookings(bookings) {

    const table =
        document.getElementById(
            "bookings"
        );

    table.innerHTML = "";

    bookings.forEach(booking => {

        table.innerHTML += `
            <tr>

                <td>
                    ${booking.confirmation_id}
                </td>

                <td>
                    ${booking.name}
                </td>

                <td>
                    ${booking.room || "Not Assigned"}
                </td>

                <td>
                    ${booking.guests}
                </td>

                <td>

                    <select
                        class="${getStatusClass(booking.status)}"
                        onchange="changeStatus('${booking.confirmation_id}', this.value)"
                    >

                        <option
                            value="Pending"
                            ${booking.status === "Pending" ? "selected" : ""}
                        >
                            Pending
                        </option>

                        <option
                            value="Confirmed"
                            ${booking.status === "Confirmed" ? "selected" : ""}
                        >
                            Confirmed
                        </option>

                        <option
                            value="Checked In"
                            ${booking.status === "Checked In" ? "selected" : ""}
                        >
                            Checked In
                        </option>

                        <option
                            value="Checked Out"
                            ${booking.status === "Checked Out" ? "selected" : ""}
                        >
                            Checked Out
                        </option>

                        <option
                            value="Cancelled"
                            ${booking.status === "Cancelled" ? "selected" : ""}
                        >
                            Cancelled
                        </option>

                    </select>

                </td>

                <td>
                    ${booking.check_in}
                </td>

                <td>
                    ${booking.phone}
                </td>

                <td>

                    <button
                        onclick="editBooking('${booking.confirmation_id}')"
                    >
                        Edit
                    </button>

                    <button
                        onclick="deleteBooking('${booking.confirmation_id}')"
                    >
                        Delete
                    </button>

                </td>

            </tr>
        `;
    });
}


function filterBookings() {

    const search = document
        .getElementById("search")
        .value
        .toLowerCase();

    const filtered =
        allBookings.filter(
            booking =>

                String(
                    booking.name || ""
                )
                    .toLowerCase()
                    .includes(search)

                ||

                String(
                    booking.confirmation_id ||
                    ""
                )
                    .toLowerCase()
                    .includes(search)
        );

    renderBookings(
        filtered
    );
}


async function deleteBooking(id) {

    const response = await fetch(

        buildApiUrl(
            `/admin/booking/${encodeURIComponent(id)}`
        ),

        {
            method: "DELETE"
        }
    );

    if (response.ok) {

        alert(
            "Booking deleted successfully."
        );

        await Promise.all([
            loadBookings(),
            loadRooms()
        ]);

    } else {

        const errorData =
            await response.json()
                .catch(
                    () => ({})
                );

        console.error(
            "Delete booking failed:",
            errorData
        );

        alert(
            errorData.detail ||
            "Failed to delete booking."
        );
    }
}


function editBooking(id) {

    const booking =
        allBookings.find(
            booking =>
                booking.confirmation_id ===
                id
        );

    if (!booking) {

        console.error(
            "Booking not found:",
            id
        );

        alert(
            "Booking not found."
        );

        return;
    }

    editId = id;

    const phoneInput =
        document.getElementById(
            "editPhone"
        );

    const roomSelect =
        document.getElementById(
            "editRoom"
        );

    const modal =
        document.getElementById(
            "editModal"
        );

    if (
        !phoneInput ||
        !roomSelect ||
        !modal
    ) {

        console.error(
            "Booking modal elements are missing."
        );

        alert(
            "Booking edit modal is not configured correctly."
        );

        return;
    }

    phoneInput.value =
        booking.phone || "";

    roomSelect.innerHTML = `
        <option value="Not Assigned">
            Not Assigned
        </option>
    `;

    allRooms.forEach(room => {

        const roomNumber =
            String(
                room.room_number
            );

        const currentRoom =
            String(
                booking.room ||
                "Not Assigned"
            );

        const isAvailable =
            room.status ===
            "Available";

        const isCurrentRoom =
            roomNumber ===
            currentRoom;

        if (
            isAvailable ||
            isCurrentRoom
        ) {

            const statusLabel =
                isCurrentRoom
                    ? `${room.status} — Current Room`
                    : room.status;

            roomSelect.innerHTML += `
                <option value="${roomNumber}">

                    ${roomNumber}
                    —
                    ${room.type}
                    —
                    ${room.view}
                    —
                    ${statusLabel}

                </option>
            `;
        }
    });

    roomSelect.value =
        booking.room ||
        "Not Assigned";

    modal.style.display =
        "flex";
}


function closeEdit() {

    document.getElementById(
        "editModal"
    ).style.display =
        "none";

    editId = null;
}


async function saveEdit() {

    const currentBookingId =
        editId;

    const newPhone =
        document.getElementById(
            "editPhone"
        ).value;

    const newRoom =
        document.getElementById(
            "editRoom"
        ).value;

    const response = await fetch(

        buildApiUrl(
            `/admin/booking/${encodeURIComponent(currentBookingId)}`
        ),

        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                phone: newPhone,
                room: newRoom
            })
        }
    );

    if (response.ok) {

        closeEdit();

        await Promise.all([
            loadBookings(),
            loadRooms()
        ]);

    } else {

        const errorData =
            await response.json()
                .catch(
                    () => ({})
                );

        console.error(
            "Booking update failed:",
            errorData
        );

        alert(
            errorData.detail ||
            "Failed to update booking"
        );
    }
}


async function changeStatus(
    id,
    status
) {

    const response = await fetch(

        buildApiUrl(
            `/admin/booking/${encodeURIComponent(id)}/status`
        ),

        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                status: status
            })
        }
    );

    if (response.ok) {

        loadBookings();

    } else {

        const errorData =
            await response.json()
                .catch(
                    () => ({})
                );

        alert(
            errorData.detail ||
            "Failed to update booking status."
        );
    }
}


function getStatusClass(status) {

    switch (status) {

        case "Pending":
            return "status-pending";

        case "Confirmed":
            return "status-confirmed";

        case "Checked In":
            return "status-checkedin";

        case "Checked Out":
            return "status-checkedout";

        case "Cancelled":
            return "status-cancelled";

        default:
            return "";
    }
}


function editRoom(roomNumber) {

    editRoomNumber =
        String(
            roomNumber
        );

    const room =
        allRooms.find(
            r =>
                String(
                    r.room_number
                )
                ===
                String(
                    roomNumber
                )
        );

    if (!room) {

        alert(
            "Room not found."
        );

        return;
    }

    const typeSelect =
        document.getElementById(
            "editRoomType"
        );

    const viewSelect =
        document.getElementById(
            "editRoomView"
        );

    ensureSelectOption(
        typeSelect,
        room.type
    );

    ensureSelectOption(
        viewSelect,
        room.view
    );

    typeSelect.value =
        room.type || "";

    viewSelect.value =
        room.view || "";

    document.getElementById(
        "editRoomStatus"
    ).value =
        room.status ||
        "Available";

    document.getElementById(
        "roomEditModal"
    ).style.display =
        "flex";
}


function ensureSelectOption(
    selectElement,
    value
) {

    if (
        !selectElement ||
        !value
    ) {
        return;
    }

    const exists =
        Array.from(
            selectElement.options
        ).some(
            option =>
                option.value ===
                value
        );

    if (!exists) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            value;

        option.textContent =
            value;

        selectElement.appendChild(
            option
        );
    }
}


function closeRoomEdit() {

    document.getElementById(
        "roomEditModal"
    ).style.display =
        "none";

    editRoomNumber = null;
}


async function saveRoomEdit() {

    const currentRoomNumber =
        editRoomNumber;

    const newType =
        document.getElementById(
            "editRoomType"
        ).value;

    const newView =
        document.getElementById(
            "editRoomView"
        ).value;

    const newStatus =
        document.getElementById(
            "editRoomStatus"
        ).value;

    const response = await fetch(

        buildApiUrl(
            `/admin/room/${encodeURIComponent(currentRoomNumber)}`
        ),

        {
            method: "PUT",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                type: newType,
                view: newView,
                status: newStatus
            })
        }
    );

    if (response.ok) {

        closeRoomEdit();

        await Promise.all([
            loadBookings(),
            loadRooms()
        ]);

    } else {

        const errorData =
            await response.json()
                .catch(
                    () => ({})
                );

        alert(
            errorData.detail ||
            "Failed to update room."
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateHotelUI();

        loadBookings();
        loadRooms();
    }
);