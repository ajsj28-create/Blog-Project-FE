const cl = console.log;
const base_url = `http://localhost:3000`;  //OR as per Env
const allData_url = `${base_url}/blogs`;
const blogsContainer = document.getElementById('blogsContainer');
const alertsContainer = document.getElementById('alertsContainer');
const CurrentUserIdControl = document.getElementById('CurrentUserId');
const blogsForm = document.getElementById('blogsForm');
const titleControl = document.getElementById('title');
const categoryControl = document.getElementById('category');
const contentControl = document.getElementById('content');
const userIdControl = document.getElementById('userId');
const loader = document.getElementById('loader');
const addBtn = document.getElementById('addBtn');
const updateBtn = document.getElementById('updateBtn');

const escapeHtml = (str) => {
    if(!str){
        return `NA`
    }else{
        return String(str)
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
    }
};

const objFromControls = () => {
    return {
        title: titleControl.value,
        category: categoryControl.value,
        content: contentControl.value,
        userId: userIdControl.value || CurrentUserIdControl.value
    }
};

const showAlertContainer = (content, color, timer = 3000) => {
    alertsContainer.innerHTML = content
    alertsContainer.className = `alert alert-${color}`
    setTimeout((() => {
        alertsContainer.innerHTML = ``
        alertsContainer.className = ``
    }), timer)
};

const getDateString = (ms) => {
    const date = new Date(ms)
    return date.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    })
};

const truncateText = (str, char = 250) => {
    return str.length < char ? str : str.slice(0, char) + '...'
};

const getTimestamp = (blog) => {
    if(blog.updatedAtMs > blog.createdAtMs){
        return `Last updated at ${getDateString(blog.updatedAtMs)} by User ${escapeHtml(blog.userId)}`
    }else{
        return `Created at ${getDateString(blog.createdAtMs)} by User ${escapeHtml(blog.userId)}`
    }
};

const makeApiCall = async (method, url, body) => {
    loader.classList.remove('d-none')
    body = body ? JSON.stringify(body) : null
    let configObj = {
        method: method,
        headers: {
            "Content-type": "application/json",
            "Authorization": "Bearer your_token"
        },
        body: body
    }
    try{
        let res = await fetch(url, configObj)
        if(!res.ok){
            throw new Error(`${res.status}: ${res.statusText}`)
        }
        return res.json()
    }catch(err){
        showAlertContainer(err, 'danger')
    }finally{
        loader.classList.add('d-none')
    }
};

const renderAllBlogs = (arr) => {
    let result = ``
    arr.forEach(blog => {
        result += `
            <div class="col-md-6 mb-3" id="${blog._id}">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="m-0">${escapeHtml(blog.title)}</h5>
                        <span class="mb-2">${getTimestamp(blog)}</span>
                        <p>${escapeHtml(truncateText(blog.content))}</p>
                    </div>
                    <div class="card-footer d-flex justify-content-between align-items-center">
                        <div onclick="onLike(this)" class="like-group" role="button"><i class="fa-solid fa-heart mr-1 color-red"></i>${blog.likesCount}</div>
                        <div class="button-group">
                            <button onclick="onView(this)" class="btn btn-secondary btn-sm mr-1">View</button>
                            <button onclick="onEdit(this)" class="btn btn-primary btn-sm mr-1">Edit</button>
                            <button onclick="onDelete(this)" class="btn btn-danger btn-sm">Delete</button>
                        </div>
                    </div>
                </div>
            </div>`
    })
    blogsContainer.innerHTML = result
};

const fetchAllBlogs = async () => {
    let data = await makeApiCall('GET', allData_url, null)
    renderAllBlogs(data.reverse())
};

fetchAllBlogs();

const createNewBlog = (blog) => {
    let newCol = document.createElement('div')
    newCol.className = `col-md-6 mb-3`
    newCol.id = blog._id
    newCol.innerHTML = `
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="m-0">${escapeHtml(blog.title)}</h5>
                        <span class="mb-2">Created at ${getDateString(blog.createdAtMs)} by User ${escapeHtml(blog.userId)}</span>
                        <p>${escapeHtml(truncateText(blog.content))}</p>
                    </div>
                    <div class="card-footer d-flex justify-content-between align-items-center">
                        <div onclick="onLike(this)" class="like-group" role="button"><i class="fa-solid fa-heart mr-1 color-red"></i>${blog.likesCount}</div>
                        <div class="button-group">
                            <button onclick="onView(this)" class="btn btn-secondary btn-sm mr-1">View</button>
                            <button onclick="onEdit(this)" class="btn btn-primary btn-sm mr-1">Edit</button>
                            <button onclick="onDelete(this)" class="btn btn-danger btn-sm">Delete</button>
                        </div>
                    </div>
                </div>`
    blogsContainer.prepend(newCol)
    showAlertContainer(`New Blog created successfully.`, 'success')             
};

const patchData = (blog) => {
    titleControl.value = blog.title
    categoryControl.value = blog.category
    contentControl.value = blog.content
    userIdControl.value = blog.userId
    CurrentUserIdControl.value = blog.userId
    addBtn.classList.add('d-none')
    updateBtn.classList.remove('d-none')
    window.scroll({
        top: 0,
        behavior: 'smooth'
    })
};

const updateBlogUi = (blog) => {
    let updateCol = document.getElementById(blog._id)
    updateCol.querySelector('.card-body h5').innerHTML = escapeHtml(blog.title)
    updateCol.querySelector('.card-body span').innerHTML = `Last updated at ${getDateString(blog.updatedAtMs)} by User ${escapeHtml(blog.userId)}`
    updateCol.querySelector('.card-body p').innerHTML = escapeHtml(truncateText(blog.content))
    updateCol.querySelector('.card-footer .like-group').innerHTML = `<i class="fa-solid fa-heart mr-1 color-red"></i>${blog.likesCount}` 
    addBtn.classList.remove('d-none')
    updateBtn.classList.add('d-none')
    showAlertContainer(`Blog updated successfully.`, 'success')
};

const onBlogAdd = async (eve) => {
    eve.preventDefault()
    let newBlog = objFromControls()
    CurrentUserIdControl.setAttribute('value', newBlog.userId)
    let data = await makeApiCall('POST', allData_url, newBlog)
    blogsForm.reset()
    createNewBlog(data)
};

const onView = async (ele) => {
    blogsForm.reset()
    if(!updateBtn.className.includes('d-none')){
        updateBtn.classList.add('d-none')
        addBtn.classList.remove('d-none')
    } 
    let viewId = ele.closest('.col-md-6').id
    let view_url = `${allData_url}/${viewId}`
    let data = await makeApiCall('GET', view_url, null)
    let content = `
            <h5 class="m-0">${data.title}</h5>
            <span>${getTimestamp(data)}<span>
            <p class="mt-2">${data.content}</p>
            <span>Likes: ${data.likesCount}</span>
            `
    showAlertContainer(content, 'info', 7000)
    window.scroll({
        top: 0,
        behavior: 'smooth'
    })
};

const onEdit = async (ele) => {
    let editId = ele.closest('.col-md-6').id
    localStorage.setItem('editId', editId)
    let edit_url = `${allData_url}/${editId}`
    let data = await makeApiCall('GET', edit_url, null)
    patchData(data)
};

const onBlogUpdate = async () => {
    let updateId = localStorage.getItem('editId')
    let update_url = `${allData_url}/${updateId}`
    let updatedBlog = objFromControls()
    CurrentUserIdControl.setAttribute('value', updatedBlog.userId)
    let data = await makeApiCall('PUT', update_url, updatedBlog)
    blogsForm.reset()
    updateBlogUi(data)
};

const onLike = async (ele) => {
    let likeId = ele.closest('.col-md-6').id
    let like_url = `${allData_url}/${likeId}/like`
    let likeUserId = {userId: CurrentUserIdControl.value}
    let data = await makeApiCall('POST', like_url, likeUserId)
    document.getElementById(likeId).querySelector('.card-footer .like-group').innerHTML = `<i class="fa-solid fa-heart mr-1 color-red"></i>${data.likesCount}`
    showAlertContainer(data.message, 'info')
};

const onDelete = (ele) => {
    blogsForm.reset()
    if(!updateBtn.className.includes('d-none')){
        updateBtn.classList.add('d-none')
        addBtn.classList.remove('d-none')
    }
    let deleteId = ele.closest('.col-md-6').id
    let deleteTitle = document.getElementById(deleteId).querySelector('.card-body h5').innerHTML
    let delete_url = `${allData_url}/${deleteId}`
    swal.fire({
        title: `Do you want to delete ${deleteTitle}?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#007bff",
        confirmButtonText: "Delete"
      }).then(async (result) => {
        if(result.isConfirmed){
            let data = await makeApiCall('DELETE', delete_url, null)
            ele.closest('.col-md-6').remove()
            showAlertContainer(data.message, 'danger')
        }
      });
};

blogsForm.addEventListener('submit', onBlogAdd);
updateBtn.addEventListener('click', onBlogUpdate);