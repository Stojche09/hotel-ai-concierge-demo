const API_BASE =
    "https://hotel-ai-backend-production.up.railway.app";

const AUTH_TOKEN_KEY =
    "hotel_admin_access_token";

const AUTH_USER_KEY =
    "hotel_admin_user";

let allBookings = [];
let allRooms = [];

let editId = null;
let editRoomNumber = null;


// =========================================================
// AUTH STORAGE
// =========================================================

function getAccessToken() {

    return sessionStorage.getItem(
        AUTH_TOKEN_KEY
    );
}


function getStoredUser() {

    const rawUser =
        sessionStorage.getItem(
            AUTH_USER_KEY
        );

    if (!rawUser) {
        return null;
    }

    try {

        return JSON.parse(
            rawUser
        );

    } catch (error) {

        console.error(
            "Failed to parse stored admin user:",
            error
        );

        return null;
    }
}


function saveAuthSession(
    accessToken,
    user
) {

    sessionStorage.setItem(
        AUTH_TOKEN_KEY,
        accessToken
    );

    sessionStorage.setItem(
        AUTH_USER_KEY,
        JSON.stringify(user)
    );
}


function clearAuthSession() {

    sessionStorage.removeItem(
        AUTH_TOKEN_KEY
    );

    sessionStorage.removeItem(
        AUTH_USER_KEY
    );
}


// =========================================================
// LOGIN / LOGOUT
// =========================================================

function showLoginScreen(
    message = ""
) {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const dashboardApp =
        document.getElementById(
            "dashboardApp"
        );

    const loginError =
        document.getElementById(
            "loginError"
        );

    if (dashboardApp) {
        dashboardApp.hidden = true;
    }

    if (loginScreen) {
        loginScreen.hidden = false;
    }

    if (loginError) {
        loginError.textContent =
            message;
    }

    document.title =
        "Hotel Admin Login";
}


function showDashboard() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );

    const dashboardApp =
        document.getElementById(
            "dashboardApp"
        );

    if (loginScreen) {
        loginScreen.hidden = true;
    }

    if (dashboardApp) {
        dashboardApp.hidden = false;
    }

    updateHotelUI();
}


async function handleLogin(event) {

    event.preventDefault();

    const usernameInput =
        document.getElementById(
            "loginUsername"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );

    const loginButton =
        document.getElementById(
            "loginButton"
        );

    const loginError =
        document.getElementById(
            "loginError"
        );

    const username =
        usernameInput.value.trim();

    const password =
        passwordInput.value;

    if (!username || !password) {

        loginError.textContent =
            "Username and password are required.";

        return;
    }

    loginError.textContent = "";

    loginButton.disabled = true;

    loginButton.textContent =
        "Signing in...";

    try {

        const response =
            await fetch(
                `${API_BASE}/admin/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            loginError.textContent =
                data.detail ||
                "Incorrect username or password.";

            return;
        }


        const user = {

            username:
                data.username,

            hotel_id:
                data.hotel_id,

            hotel_name:
                data.hotel_name,

            role:
                data.role
        };


        saveAuthSession(
            data.access_token,
            user
        );


        passwordInput.value = "";


        showDashboard();


        await loadDashboardData();


    } catch (error) {

        console.error(
            "Login failed:",
            error
        );

        loginError.textContent =
            "Could not connect to the server.";

    } finally {

        loginButton.disabled =
            false;

        loginButton.textContent =
            "Sign In";
    }
}


function logout() {

    clearAuthSession();

    allBookings = [];
    allRooms = [];

    editId = null;
    editRoomNumber = null;

    closeEdit();
    closeRoomEdit();


    const usernameInput =
        document.getElementById(
            "loginUsername"
        );

    const passwordInput =
        document.getElementById(
            "loginPassword"
        );


    if (usernameInput) {
        usernameInput.value = "";
    }

    if (passwordInput) {
        passwordInput.value = "";
    }


    showLoginScreen();
}


// =========================================================
// AUTHENTICATED FETCH
// =========================================================

async function authenticatedFetch(
    path,
    options = {}
) {

    const token =
        getAccessToken();


    if (!token) {

        showLoginScreen(
            "Please sign in to continue."
        );

        throw new Error(
            "Authentication required."
        );
    }


    const headers =
        new Headers(
            options.headers || {}
        );


    headers.set(
        "Authorization",
        `Bearer ${token}`
    );


    const response =
        await fetch(
            `${API_BASE}${path}`,
            {
                ...options,
                headers: headers
            }
        );


    if (response.status === 401) {

        clearAuthSession();

        showLoginScreen(
            "Your session expired. Please sign in again."
        );

        throw new Error(
            "Authentication session expired."
        );
    }


    if (response.status === 403) {

        const errorData =
            await response.json()
                .catch(
                    () => ({})
                );

        throw new Error(
            errorData.detail ||
            "You do not have permission to perform this action."
        );
    }


    return response;
}


// =========================================================
// HOTEL UI
// =========================================================

function updateHotelUI() {

    const user =
        getStoredUser();

    if (!user) {
        return;
    }


    const hotelName =
        user.hotel_name ||
        user.hotel_id ||
        "Hotel";


    const title =
        document.getElementById(
            "hotelDashboardTitle"
        );


    const subtitle =
        document.getElementById(
            "hotelDashboardSubtitle"
        );


    const sidebarHotelName =
        document.getElementById(
            "sidebarHotelName"
        );


    const loggedUsername =
        document.getElementById(
            "loggedUsername"
        );


    const headerHotelBadge =
        document.getElementById(
            "headerHotelBadge"
        );


    if (title) {

        title.textContent =
            `${hotelName} Admin Dashboard`;
    }


    if (subtitle) {

        subtitle.textContent =
            `Manage rooms, reservations and operations for ${hotelName}.`;
    }


    if (sidebarHotelName) {

        sidebarHotelName.textContent =
            hotelName;
    }


    if (loggedUsername) {

        loggedUsername.textContent =
            user.username ||
            "Admin";
    }


    if (headerHotelBadge) {

        headerHotelBadge.textContent =
            hotelName;
    }


    document.title =
        `${hotelName} Admin Dashboard`;
}


// =========================================================
// DASHBOARD DATA
// =========================================================

async function loadDashboardData() {

    await Promise.all([
        loadBookings(),
        loadRooms()
    ]);
}


// =========================================================
// BOOKINGS
// =========================================================

async function loadBookings() {

    try {

        const response =
            await authenticatedFetch(
                "/admin/bookings"
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );

            throw new Error(
                errorData.detail ||
                `Bookings request failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        if (!Array.isArray(
            data.bookings
        )) {

            throw new Error(
                "data.bookings is not an array"
            );
        }


        allBookings =
            data.bookings;


        const totalBookings =
            document.getElementById(
                "totalBookings"
            );


        if (totalBookings) {

            totalBookings.textContent =
                allBookings.length;
        }


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


        const totalGuestsElement =
            document.getElementById(
                "totalGuests"
            );


        if (totalGuestsElement) {

            totalGuestsElement.textContent =
                totalGuests;
        }


        filterBookings();


    } catch (error) {

        console.error(
            "Failed to load bookings:",
            error
        );


        allBookings = [];


        const totalBookings =
            document.getElementById(
                "totalBookings"
            );

        const totalGuests =
            document.getElementById(
                "totalGuests"
            );


        if (totalBookings) {
            totalBookings.textContent = "0";
        }


        if (totalGuests) {
            totalGuests.textContent = "0";
        }


        renderBookings([]);
    }
}


// =========================================================
// ROOMS
// =========================================================

async function loadRooms() {

    try {

        const response =
            await authenticatedFetch(
                "/admin/rooms"
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );

            throw new Error(
                errorData.detail ||
                `Rooms request failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        allRooms =
            Array.isArray(data.rooms)
                ? data.rooms
                : [];


        updateRoomStatistics();

        renderRooms();


    } catch (error) {

        console.error(
            "Failed to load rooms:",
            error
        );

        allRooms = [];

        updateRoomStatistics();

        renderRooms();
    }
}


function updateRoomStatistics() {

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


    setText(
        "totalRooms",
        totalRooms
    );


    setText(
        "availableRooms",
        availableRooms
    );


    setText(
        "occupiedRooms",
        occupiedRooms
    );


    setText(
        "cleaningRooms",
        cleaningRooms
    );


    setText(
        "maintenanceRooms",
        maintenanceRooms
    );
}


function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;
    }
}


function renderRooms() {

    const roomsBody =
        document.getElementById(
            "roomsBody"
        );


    if (!roomsBody) {
        return;
    }


    roomsBody.innerHTML = "";


    allRooms.forEach(
        room => {

            const row =
                document.createElement(
                    "tr"
                );


            const roomNumber =
                escapeHtml(
                    room.room_number
                );


            const roomType =
                escapeHtml(
                    room.type
                );


            const roomView =
                escapeHtml(
                    room.view
                );


            const roomStatus =
                escapeHtml(
                    room.status
                );


            const safeRoomNumber =
                escapeJsString(
                    room.room_number
                );


            row.innerHTML = `

                <td>
                    ${roomNumber}
                </td>

                <td>
                    ${roomType}
                </td>

                <td>
                    ${roomView}
                </td>

                <td>

                    <span
                        class="room-status ${getRoomStatusClass(room.status)}"
                    >
                        ${roomStatus}
                    </span>

                </td>

                <td>

                    <button
                        onclick="editRoom('${safeRoomNumber}')"
                    >
                        Edit
                    </button>

                </td>
            `;


            roomsBody.appendChild(
                row
            );
        }
    );
}


function getRoomStatusClass(
    status
) {

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


// =========================================================
// BOOKING TABLE
// =========================================================

function renderBookings(
    bookings
) {

    const table =
        document.getElementById(
            "bookings"
        );


    if (!table) {
        return;
    }


    table.innerHTML = "";


    bookings.forEach(
        booking => {

            const confirmationId =
                escapeHtml(
                    booking.confirmation_id
                );


            const guestName =
                escapeHtml(
                    booking.name
                );


            const room =
                escapeHtml(
                    booking.room ||
                    "Not Assigned"
                );


            const guests =
                escapeHtml(
                    booking.guests
                );


            const checkIn =
                escapeHtml(
                    booking.check_in
                );


            const checkOut =
                escapeHtml(
                    booking.check_out
                );


            const phone =
                escapeHtml(
                    booking.phone
                );


            const safeId =
                escapeJsString(
                    booking.confirmation_id
                );


            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${confirmationId}
                </td>

                <td>
                    ${guestName}
                </td>

                <td>
                    ${room}
                </td>

                <td>
                    ${guests}
                </td>

                <td>

                    <select
                        class="${getStatusClass(booking.status)}"
                        onchange="changeStatus('${safeId}', this.value)"
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

                        <option
                            value="Expired"
                            ${booking.status === "Expired" ? "selected" : ""}
                        >
                            Expired
                        </option>

                    </select>

                </td>

                <td>
                    ${checkIn}
                </td>

                <td>
                    ${checkOut}
                </td>

                <td>
                    ${phone}
                </td>

                <td>

                    <button
                        onclick="editBooking('${safeId}')"
                    >
                        Edit
                    </button>

                    <button
                        onclick="deleteBooking('${safeId}')"
                    >
                        Delete
                    </button>

                </td>
            `;


            table.appendChild(
                row
            );
        }
    );
}


// =========================================================
// BOOKING SEARCH + STATUS FILTER
// =========================================================

function filterBookings() {

    const searchInput =
        document.getElementById(
            "search"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );


    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "All";


    const filtered =
        allBookings.filter(
            booking => {

                const searchableValues = [
                    booking.name,
                    booking.confirmation_id,
                    booking.phone,
                    booking.room,
                    booking.check_in,
                    booking.check_out
                ];


                const matchesSearch =
                    !search ||
                    searchableValues.some(
                        value =>
                            String(
                                value || ""
                            )
                                .toLowerCase()
                                .includes(search)
                    );


                const matchesStatus =
                    selectedStatus === "All" ||
                    booking.status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );


    renderBookings(
        filtered
    );
}


// =========================================================
// DELETE BOOKING
// =========================================================

async function deleteBooking(
    id
) {

    const confirmed =
        window.confirm(
            `Delete booking ${id}?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await authenticatedFetch(

                `/admin/booking/${encodeURIComponent(id)}`,

                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                errorData.detail ||
                "Failed to delete booking."
            );
        }


        alert(
            "Booking deleted successfully."
        );


        await loadDashboardData();


    } catch (error) {

        console.error(
            "Delete booking failed:",
            error
        );


        alert(
            error.message
        );
    }
}


// =========================================================
// EDIT BOOKING
// =========================================================

function editBooking(
    id
) {

    const booking =
        allBookings.find(
            item =>
                item.confirmation_id ===
                id
        );


    if (!booking) {

        alert(
            "Booking not found."
        );

        return;
    }


    editId = id;


    const guestNameInput =
        document.getElementById(
            "editGuestName"
        );


    const guestsInput =
        document.getElementById(
            "editGuests"
        );


    const checkInInput =
        document.getElementById(
            "editCheckIn"
        );


    const checkOutInput =
        document.getElementById(
            "editCheckOut"
        );


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
        !guestNameInput ||
        !guestsInput ||
        !checkInInput ||
        !checkOutInput ||
        !phoneInput ||
        !roomSelect ||
        !modal
    ) {

        alert(
            "Booking edit modal is not configured correctly."
        );

        return;
    }


    guestNameInput.value =
        booking.name ||
        "";


    guestsInput.value =
        booking.guests ||
        "";


    checkInInput.value =
        booking.check_in ||
        "";


    checkOutInput.value =
        booking.check_out ||
        "";


    phoneInput.value =
        booking.phone ||
        "";


    roomSelect.innerHTML = `

        <option value="Not Assigned">
            Not Assigned
        </option>
    `;


    allRooms.forEach(
        room => {

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


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    roomNumber;


                option.textContent =
                    `${roomNumber} — ${room.type} — ${room.view} — ${statusLabel}`;


                roomSelect.appendChild(
                    option
                );
            }
        }
    );


    roomSelect.value =
        booking.room ||
        "Not Assigned";


    modal.style.display =
        "flex";
}


function closeEdit() {

    const modal =
        document.getElementById(
            "editModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    editId = null;
}


async function saveEdit() {

    const currentBookingId =
        editId;


    if (!currentBookingId) {
        return;
    }


    const newPhone =
        document.getElementById(
            "editPhone"
        ).value;


    const newRoom =
        document.getElementById(
            "editRoom"
        ).value;


    try {

        const response =
            await authenticatedFetch(

                `/admin/booking/${encodeURIComponent(currentBookingId)}`,

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


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                errorData.detail ||
                "Failed to update booking."
            );
        }


        closeEdit();


        await loadDashboardData();


    } catch (error) {

        console.error(
            "Booking update failed:",
            error
        );


        alert(
            error.message
        );
    }
}


// =========================================================
// BOOKING STATUS
// =========================================================

async function changeStatus(
    id,
    status
) {

    try {

        const response =
            await authenticatedFetch(

                `/admin/booking/${encodeURIComponent(id)}/status`,

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


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                errorData.detail ||
                "Failed to update booking status."
            );
        }


        await loadBookings();


    } catch (error) {

        console.error(
            "Status update failed:",
            error
        );


        alert(
            error.message
        );


        await loadBookings();
    }
}


function getStatusClass(
    status
) {

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

        case "Expired":
            return "status-cancelled";

        default:
            return "";
    }
}


// =========================================================
// EDIT ROOM
// =========================================================

function editRoom(
    roomNumber
) {

    editRoomNumber =
        String(
            roomNumber
        );


    const room =
        allRooms.find(
            item =>

                String(
                    item.room_number
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
        room.type ||
        "";


    viewSelect.value =
        room.view ||
        "";


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

    const modal =
        document.getElementById(
            "roomEditModal"
        );


    if (modal) {

        modal.style.display =
            "none";
    }


    editRoomNumber =
        null;
}


async function saveRoomEdit() {

    const currentRoomNumber =
        editRoomNumber;


    if (!currentRoomNumber) {
        return;
    }


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


    try {

        const response =
            await authenticatedFetch(

                `/admin/room/${encodeURIComponent(currentRoomNumber)}`,

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


        if (!response.ok) {

            const errorData =
                await response.json()
                    .catch(
                        () => ({})
                    );


            throw new Error(
                errorData.detail ||
                "Failed to update room."
            );
        }


        closeRoomEdit();


        await loadDashboardData();


    } catch (error) {

        console.error(
            "Room update failed:",
            error
        );


        alert(
            error.message
        );
    }
}


// =========================================================
// SAFE OUTPUT HELPERS
// =========================================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


function escapeJsString(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "\\",
            "\\\\"
        )
        .replaceAll(
            "'",
            "\\'"
        )
        .replaceAll(
            "\n",
            " "
        )
        .replaceAll(
            "\r",
            " "
        );
}


// =========================================================
// INITIALIZE
// =========================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const loginForm =
            document.getElementById(
                "loginForm"
            );


        if (loginForm) {

            loginForm.addEventListener(
                "submit",
                handleLogin
            );
        }


        const token =
            getAccessToken();


        const user =
            getStoredUser();


        if (
            !token ||
            !user
        ) {

            clearAuthSession();

            showLoginScreen();

            return;
        }


        showDashboard();


        await loadDashboardData();
    }
);                