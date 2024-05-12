let tasks
let uploadedFilePath = null; // Variable para almacenar la ruta del archivo subido ya que se utiliza en varios lugares

const socket = io('ws://localhost:4000/api/subscriptions', {transports: ['polling']});
// const socket = io('ws://localhost:4000/api/subscriptions', {transports: ['websocket']});
/* var socket = io.connect('ws://localhost:8000', {
  transports: ['polling']
});
*/

socket.on('mensaje', (mensaje) => {
  // Borramos lo que contenga el container de las alertas
  const container_borrar = document.getElementById('container');
  container_borrar.innerHTML = '';

  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert', 'alert-success', 'alert-dismissible');
  
  // Botón de cierre
  const closeButton = document.createElement('button');
  closeButton.setAttribute('type', 'button');
  closeButton.classList.add('btn-close');
  closeButton.setAttribute('data-bs-dismiss', 'alert');
  
  // Contenido de la tarjeta de alerta
  const strongTag = document.createElement('strong');
  strongTag.textContent = 'Alerta:';
  
  // Div para el mensaje
  const mensajeDiv = document.createElement('div');
  mensajeDiv.setAttribute('name', 'mensajeDiv');
  mensajeDiv.setAttribute('id', 'mensajeDiv');
  
  // Agregar el contenido al mensajeDiv
  mensajeDiv.textContent = mensaje;
  
  // Agregar el botón de cierre a la tarjeta de alerta
  alertDiv.appendChild(closeButton);
  
  // Agregar el texto fuerte y el mensajeDiv a la tarjeta de alerta
  alertDiv.appendChild(strongTag);
  alertDiv.appendChild(mensajeDiv);
  
  // Obtener el contenedor donde se agregará la tarjeta de alerta
  const container = document.getElementById('container');
  
  // Agregar la tarjeta de alerta al contenedor
  container.appendChild(alertDiv);

  updatesAlerts();

  setTimeout(() => {
    updatesAlerts();
    container_borrar.innerHTML = '';
    container_borrar.classList.remove('fade-out'); // Remover la clase de desvanecimiento
  }, 5000); // Remover el mensaje después de 5 segundos
});

// Funciones asincronas 
async function getProjectById(id) {
  const query = `
    query GetProjectById($id: ID!) {
      getProject(id: $id) {
        id
        name
        description
        department
        backgroundcolor
        backgroundimage
        backgroundcolorcard
        backgroundcard
        priority
        dateaccess
      }
    }
  `;
  const requestBody = JSON.stringify({
    query: query,
    variables: { id: id },
  });

  try {
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    const responseBody = await response.json();
    if (responseBody.errors) {
      console.error("Error en GraphQL:", responseBody.errors);
      throw new Error("Error al obtener el proyecto por ID");
    } else {
      return responseBody.data.getProject;
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  }
}
async function getTasksByProjectId(projectId) {
  const query = `
    query GetTasksByProjectId($projectId: ID!) {
      getTasksByProjectId(projectId: $projectId) {
        id
        project_id
        title
        description
        responsible
        enddate
        ended
        notes
        status
        pathFile
      }
    }
  `;
  const requestBody = JSON.stringify({
    query: query,
    variables: { projectId: projectId },
  });

  try {
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: requestBody,
    });

    const responseBody = await response.json();
    if (responseBody.errors) {
      console.error("Error en GraphQL:", responseBody.errors);
      throw new Error("Error al obtener las tareas por ID de proyecto");
    } else {
      //console.log("Tareas encontradas:", responseBody.data.getTasksByProjectId);
      return responseBody.data.getTasksByProjectId;
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  }
}
async function updateTaskEndDate(taskId, newEndDate) {
  const mutation = `
    mutation UpdateTask($input: TaskInput!, $updateTaskId: ID!) {
      updateTask(input: $input, id: $updateTaskId) {
        id
        ended
      }
    }
  `;
  const requestBody = {
    query: mutation,
    variables: {
      updateTaskId: taskId,
      input: {
        ended: newEndDate,
      },
    },  
  };

  try {
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseBody = await response.json();
    if (responseBody.errors) {
      console.error("Error en GraphQL:", responseBody.errors);
      throw new Error("Error al actualizar la tarea");
    } else {
      //console.log("FECHA actualizada:", responseBody.data.updateTask);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  }
}
async function updateTaskStateInProject(taskId, newState) {

  const mutation = `
    mutation UpdateTask($updateTaskId: ID!, $input: TaskInput!) {
      updateTask(id: $updateTaskId, input: $input) {
        id
        status
      }
    }
  `;

  const requestBody = {
    query: mutation,
    variables: {
      updateTaskId: taskId,
      input: {
        status: newState,
      },
    },
  };

  try {
    const response = await fetch("/api", {
      method:'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseBody = await response.json();
    if (responseBody.errors) {
      console.error('Error en GraphQL:', responseBody.errors);
      throw new Error('Error al actualizar la tarea');
    } else {
      //console.log('Tarea actualizada:', responseBody.data.updateTask);
      tasks = await getTasksByProjectId(projectId);
      showTasksCards(tasks);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
}
async function updateDateAccessProject(projectId) {
  const mutation = `
    mutation UpdateProject($updateProjectId: ID!, $input: ProjectInput!) {
      updateProject(id: $updateProjectId, input: $input) {
        id
        dateaccess
      }
    }
  `;

  const requestBody = {
    query: mutation,
    variables: {
      updateProjectId: projectId,
      input: {
        dateaccess: new Date().toString(),
      },
    },
  };

  try {
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseBody = await response.json();
    if (responseBody.errors) {
      console.error("Error en GraphQL:", responseBody.errors);
      throw new Error("Error al actualizar la fecha de acceso del proyecto");
    } else {
      //console.log("Proyecto actualizado:", responseBody.data.updateProject);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  }
}
async function loadFile(selector, taskId = null) {
  var fileField = document.querySelector(selector);
  console.log('Campo de archivo:', fileField);
  // Si no hay archivo seleccionado, establece uploadedFilePath en null y retorna
  if (fileField.files.length === 0) {
    uploadedFilePath = null;
    return;
  }
  var formData = new FormData();
  // Agrega el archivo seleccionado al objeto FormData
  formData.append('file', fileField.files[0]);

  try {
    const response = await fetch('/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      uploadedFilePath = result.path; // Guarda la ruta del archivo en la variable
      // Luego, actualiza la tarea con la ruta del archivo si taskId tiene un valor truthy
      console.log("que le pasa a taskId", taskId);
      
      if (taskId) {
        await updateTaskWithFilePath(taskId, uploadedFilePath);
      }
    } else {
      console.error('Error:', response.statusText);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
async function updateTaskWithFilePath(taskId, filePath) {
  console.log('Ruta del archivo:', filePath);
  console.log('ID de la tarea:', taskId);

  // Si filePath es null, no realizar ninguna actualización
  if (filePath === null) {
    console.log('No se seleccionó ningún archivo, no se realiza ninguna actualización');
    return;
  }

  const serverUrl = 'https://69d2dk-4000.csb.app'; 
  // Elimina 'front\' de la ruta del archivo
  // const adjustedFilePath = filePath.replace('front\\', '');
  const adjustedFilePath = filePath.replace('front/', '');

  const downloadUrl = `${serverUrl}/${adjustedFilePath.replace(/\\/g, '/')}`;
  console.log('URL de descarga:', downloadUrl);
  const mutation = `
    mutation UpdateTask($id: ID!, $input: TaskInput!) { 
      updateTask(id: $id, input: $input) {
        id
        pathFile
      }
    } 
  `;

  const requestBody = {
    query: mutation,
    variables: {
      id: taskId,
      input: {
        pathFile: downloadUrl,
      },
    },
  };

  try {
    const response = await fetch("/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const responseBody = await response.json();
    if (responseBody.errors) {
      console.error("Error en GraphQL:", responseBody.errors);
      throw new Error("Error al actualizar la tarea");
    } else {
      console.log("Tarea actualizada:", responseBody.data.updateTask);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  }
}
async function updatesAlerts(){
  const projectId = new URLSearchParams(window.location.search).get("id");
  tasks = await getTasksByProjectId(projectId);
  showTasksCards(tasks);
}

// Funcionalidades para la vista de detalle de una tarjeta
function formatDate(dateString) {
  //console.log('Fecha:', dateString);
  const date = new Date(parseInt(dateString, 10));
  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic",];
  const year = date.getFullYear();
  const month = months[date.getMonth()];
  const day = date.getDate();

  return `${day} de ${month} ${year}`;
}
function createTaskCard(task) {
  const formattedDate = formatDate(task.enddate);
  const isEnded = task.ended ? "green-background" : "";

  return `
    <li class="btn btn-light task-card-btn " data-task-id="${task.id}" draggable="true" ondragstart="drag(event)" ondragover="return false;">  
      <div class="task-card mb-2">
        <div class="task-details">
          <h6 class="task-title">${task.title}</h6>
          <div class="task-end-date ${isEnded}">
            <input type="checkbox" id="taskCheckbox-${task.id}" ${task.ended ? 'checked' : ''}>
            <label for="taskCheckbox-${task.id}">Finaliza: ${formattedDate}</label>
          </div>
          <button class="btn btn-primary delete-button" style="display:none;">ELIMINAR</button>
        </div>
      </div>
    </li>
  `; 
  socket.emit('mensaje', "Tarjeta creada");
}
function showTasksCards(tasks) {
  const taskCardsContainer = $(".task-cards");
  taskCardsContainer.empty();

  tasks.forEach((task) => {
    const taskCardHtml = createTaskCard(task);
    const taskStatus = task.status.toUpperCase();

    // Agrega la tarjeta al contenedor correspondiente según el estado de la tarea
    switch (taskStatus) {
      case "POR HACER":
        $('.task-cards[data-state="POR HACER"]').append(taskCardHtml);
        break;
      case "EN PROGRESO":
        $('.task-cards[data-state="EN PROGRESO"]').append(taskCardHtml);
        break;
      case "FINALIZADO":
        $('.task-cards[data-state="FINALIZADO"]').append(taskCardHtml);
        break;
      default:
        console.log(`Estado no reconocido para la tarea: ${taskStatus}`);
    }
  });
}

// Funciones para el drag and drop
function allowDrop(event) {
  event.preventDefault();
}
function drag(event) {
  const taskId = event.target.getAttribute("data-task-id");
  event.dataTransfer.setData("text/plain", taskId);
}
function drop(event) {
  event.preventDefault();
  var data = event.dataTransfer.getData("text");
  //console.log("Elemento soltado:", data);
  var draggedElement = document.querySelector('[data-task-id="' + data + '"]');
  //console.log("Elemento arrastrado:", draggedElement);

  // Verificar si el elemento arrastrado es válido
  if (draggedElement) {
    var targetColumn = event.target.closest(".col-4"); // Encuentra la columna más cercana al punto de soltar
    var targetContainer = targetColumn.querySelector(".task-cards");

    // Verificar si el contenedor de destino es válido
    if (targetContainer) {
      targetContainer.appendChild(draggedElement);
      var targetState = targetContainer.getAttribute("data-state");
      draggedElement.dataset.state = targetState;
      updateTaskStateInProject(data, targetState);
    } else {
      console.error(
        "No se pudo encontrar el contenedor de tarjetas dentro de la columna."
      );
    }
  } else {
    console.error(
      "No se pudo encontrar el elemento arrastrado con el ID:",
      data
    );
  }
}

// Funciones para el manejo de eventos
$(document).ready(async function () {
  
  // Obtener el ID del proyecto de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get("id");

  const project = await getProjectById(projectId);

  if (project) {
    // Actualizar el campo dateAcces
    updateDateAccessProject(projectId);

    // Mostrar el nombre del proyecto en la barra de navegación
    $("#projectName").text(project.name.toUpperCase());
    
    try {
      tasks = await getTasksByProjectId(projectId);
      //console.log('Tareas encontradas:', tasks);
      if (tasks) {
        showTasksCards(tasks);
      }
    } catch (error) {
      console.error("Error al obtener las tareas:", error);
    }

    // Abrir el modal de nueva tarea
    $(".addCardBtn").click(function () {
      var defaultState = $(this).data("state");
      console.log("Estado por defecto:", defaultState);
      $("#taskStatus").val(defaultState);
      $("#addTaskModal").modal("show");
    });

    /****************************************************************************************************** */
    /* SIDEBAR */
    /****************************************************************************************************** */

    // Mostrar INFO del proyecto en el sidebar y hacerlos editables
    $("#sidebarProjectName").text(project.name.toUpperCase());
    $("#sidebarProjectNameEdit").val(project.name);
    $("#sidebarDescription").text(project.description);
    $("#sidebarBackgroundColorCard").val(project.backgroundcolorcard);
    if (project.backgroundcard !== "") {
      $("#previewImageCard")
        .attr("src", `/assets/BackgroundCards/${project.backgroundcard}`)
        .show();
    }
    $("#sidebarDepartment").val(project.department);
    $("#sidebarBackgroundColor").val(project.backgroundcolor);
    if (project.backgroundimage !== "") {
      $("#previewImage")
        .attr("src", `/assets/BackgroundsProjects/${project.backgroundimage}`)
        .show();
    }

    $("#colorSection, #imageSection, #colorSectionCard, #imageSectionCard").hide();
    // Mostrar el tipo de fondo seleccionado
    $("#sidebarBackgroundType").change(function () {
      var selectedType = $(this).val();
      
       if (selectedType === "color") {
        $("#colorSection").show();
        $("#imageSection").hide();
        $("#sidebarBackgroundImage").val("");
        console.log('Imagen de fondo:', $('#sidebarBackgroundImage').val());
      } else {
        $("#colorSection").hide();
        $("#imageSection").show();
        console.log('Color de fondo:', $('#sidebarBackgroundColor').val());
      }
      //console.log('Tipo de fondo:', selectedType);
    });
    $("#sidebarBackgroundTypeCard").change(function () {
      var selectedType = $(this).val();
  
      if (selectedType === "color") {
        $("#colorSectionCard").show();
        $("#imageSectionCard").hide();
        $("#sidebarBackgroundImageCard").val("");
        //console.log('Imagen de fondo:', $('#sidebarBackgroundImageCard').val());
      } else {
        $("#colorSectionCard").hide();
        $("#imageSectionCard").show();
        console.log('Color de fondo:', $('#sidebarBackgroundColorCard').val());
      }
      //console.log('Tipo de fondo:', selectedType);
    });

    // Mostrar la vista previa de la imagen seleccionada
    $("#sidebarBackgroundImage").change(function () {
      var selectedImage = $(this).val();
      console.log("Imagen de fondo:", selectedImage);
      if (selectedImage !== "") {
        $("#previewImage")
          .attr("src", `/assets/BackgroundsProjects/${selectedImage}`)
          .show();
      } else {
        $("#previewImage").hide();
      }
    });
    $("#sidebarBackgroundImageCard").change(function () {
      var selectedImage = $(this).val();
      console.log("Imagen de fondo:", selectedImage);
      if (selectedImage !== "") {
        $("#previewImageCard")
          .attr("src", `/assets/BackgroundCards/${selectedImage}`)
          .show();
      } else {
        $("#previewImageCard").hide();
      }
    });

    // Guardar los cambios cuando se hace clic en el botón "Guardar Cambios"
    $("#saveChangesBtn").click(async function () {
      const projectId = new URLSearchParams(window.location.search).get("id");
      const newName = $("#sidebarProjectNameEdit").val();
      const newDescription = $("#sidebarDescription").val();
      const newDepartment = $("#sidebarDepartment").val();
      const newBackgroundColor = $("#sidebarBackgroundColor").val();
      const newBackgroundImage = $("#sidebarBackgroundImage").val() || "";
      const newBackgroundColorCard = $("#sidebarBackgroundColorCard").val();
      const newBackgroundImageCard = $("#sidebarBackgroundImageCard").val() || "";

      console.log("background card:", newBackgroundColorCard);
      console.log("background image card:", newBackgroundImageCard);  
      
      const mutation = `
        mutation UpdateProject($updateProjectId: ID!, $input: ProjectInput!) {
          updateProject(id: $updateProjectId, input: $input) {
            id
            name
            description
            department
            backgroundcolor
            backgroundimage
            backgroundcolorcard
            backgroundcard
          }
        }
      `;
      const requestBody = {
        query: mutation,
        variables: {
          updateProjectId: projectId,
          input: {
            name: newName,
            description: newDescription,
            department: newDepartment,
            backgroundcolor: newBackgroundColor,
            backgroundimage: newBackgroundImage,
            backgroundcolorcard: newBackgroundColorCard,
            backgroundcard: newBackgroundImageCard,
          },
        },
      };

      try {
        const response = await fetch("/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const responseBody = await response.json();
        if (responseBody.errors) {
          console.error("Error en GraphQL:", responseBody.errors);
          throw new Error("Error al actualizar el proyecto");
        } else {
          socket.emit('mensaje', "Tarjeta [ " + newName + " ] --> Actualizada");
          location.reload();
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
      }
    });

    // Aplicar el color de fondo al elemento deseado en la página
    if (project.backgroundimage != "") {
      $("body").css(
        "background-image",
        `url(/assets/BackgroundsProjects/${project.backgroundimage})`
      );
      $("body").css("background-size", "cover");
      $("body").css("background-position", "center");
      $("body").css("background-repeat", "no-repeat");
      //console.log('Imagen de fondo:', project.backgroundimage);
    } else {
      $("body").css("background-color", `${project.backgroundcolor}`);
      //console.log('Color de fondo:', project.backgroundcolor);
    }

    // Abrir y cerrar el menú lateral al hacer clic en el botón "INFORMACIÓN"
    $("#board-menu").click(function () {
      $("#sidebar-menu").css("width", "380px");
    });
    $("#close-sidebar").click(function () {
      $("#sidebar-menu").css("width", "0");
    });

    // Evento para señalar la fecha de finalización de una tarea
    $(document).on("click", '.task-end-date input[type="checkbox"], .task-end-date label', function (event) {
      event.stopPropagation();
      let isChecked = $(event.target).prop("checked");

      if ($(event.target).is('label')) {
        const checkboxId = $(event.target).attr("for");
        const checkbox = $(`#${checkboxId}`);
        isChecked = checkbox.prop("checked");
      }
      const taskId = $(this).closest(".task-card-btn").data("task-id");
      $(event.target).closest(".task-end-date").toggleClass("green-background", isChecked);

      updateTaskEndDate(taskId, isChecked);
      socket.emit('mensaje', "Tarjeta Finalizada.");
    });

    // Evento al hacer clic en una tarea
    $(document).on("click", ".task-card-btn", function (event) {
      event.stopPropagation();

      const taskId = $(this).data("task-id");
      //console.log("ID de la tarea:", taskId);
      const taskToEdit = tasks.find(
        (task) => task.id.toString() === taskId.toString()
      );
      //console.log("Tarea a editar:", taskToEdit.enddate);

      const editDate = new Date(parseInt(taskToEdit.enddate, 10));
      const year = editDate.getFullYear();
      const month = editDate.getMonth() + 1;
      const day = editDate.getDate();
      const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      //console.log('Estado:', taskToEdit.status);

      // Si se encuentra la tarea, llena el modal de edición con los datos de la tarea
      if (taskToEdit) {
        $("#editTaskTitle").val(taskToEdit.title);
        $("#editTaskDescription").val(taskToEdit.description);
        $("#editTaskResponsibles").val(taskToEdit.responsible.join(", "));
        $("#editTaskEndDate").val(formattedDate);
        $("#editTaskNotes").val(taskToEdit.notes);
        $("#editTaskStatus").val(taskToEdit.status);

        // Guarda el id de la tarea en un lugar accesible para cuando se guarde el formulario
        $("#editTaskForm").data("task-id", taskToEdit.id);
        console.log('tarea a editar', taskToEdit);

        document.getElementById('editTaskFile').value;
        console.log('Ruta del archivo al editar:', taskToEdit.pathFile);
        // Actualiza el enlace del archivo
        if (taskToEdit.pathFile) {
          $("#editTaskFileLink").attr("href", taskToEdit.pathFile).show();
          // Obtiene el nombre del archivo de la ruta del archivo
          const fileName = taskToEdit.pathFile.split('/').pop();

          // Actualiza el texto del enlace de descarga
          $("#editTaskFileLink").text(`Descargar archivo: ${fileName}`);
        } else {
          $("#editTaskFileLink").hide();
        }

        // Muestra el modal
        $("#editTaskModal").modal("show");
      }
    });

    // Editar una tarea
    $("#editTaskForm").submit(async function (event) {
      event.preventDefault();
      const taskId = $(this).data("task-id");
      const title = $("#editTaskTitle").val();
      const description = $("#editTaskDescription").val();
      const responsible = $("#editTaskResponsibles").val().split(", ");
      const enddate = $("#editTaskEndDate").val();
      const notes = $("#editTaskNotes").val();
      const status = $("#editTaskStatus").val();
      const uploadedFilePath = await loadFile('#editTaskFile', taskId);
      const pathFile = uploadedFilePath || null;

      const mutation = `
        mutation UpdateTask($updateTaskId: ID!, $input: TaskInput!) {
          updateTask(id: $updateTaskId, input: $input) {
            id
            project_id
            title
            description
            responsible
            enddate
            notes
            status
            pathFile
          }
        }
      `;
      const requestBody = { 
        query: mutation,
        variables: {
          updateTaskId: taskId,
          input: {
            title: title,
            description: description,
            responsible: responsible,
            enddate: enddate,
            notes: notes,
            status: status,
          },
        },
      };

      try { 
        const response = await fetch("/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const responseBody = await response.json();
        if (responseBody.errors) {
          console.error("Error en GraphQL:", responseBody.errors);
          throw new Error("Error al actualizar la tarea");
        } else {
          console.log("Tarea actualizada en la funcion:", responseBody.data.updateTask);
          tasks = await getTasksByProjectId(projectId);
          showTasksCards(tasks);
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
      }
      
      // Cierra el modal
      $("#editTaskModal").modal("hide");
      socket.emit('mensaje', "Tarjeta [ "+title+" ] -->Modificada");
    });

    // Agregar una nueva tarea al proyecto
    $("#addTaskForm").submit(async function (event) {
      event.preventDefault();
      const projectId = new URLSearchParams(window.location.search).get("id");

      // Crea un nuevo objeto de tarea con los datos del formulario
      const taskData = {
        project_id: projectId,
        title: $("#taskTitle").val(),
        description: $("#taskDescription").val(),
        responsible: $("#taskResponsibles").val().split(","), // Suponiendo que los responsables se separan por comas
        enddate: $("#taskEndDate").val(),
        notes: $("#taskNotes").val(),
        status: $("#taskStatus").val(),

      };

      const mutation = `
        mutation CreateTask($input: TaskInput!) { 
          createTask(input: $input) {
            id
            project_id
            title
            description
            responsible
            enddate
            notes
            status
          }
        } 
      `;
      const requestBody = {
        query: mutation,
        variables: {
          input: taskData,
        },
      };

      try {
        const response = await fetch("/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        const responseBody = await response.json();
        if (responseBody.errors) {
          console.error("Error en GraphQL:", responseBody.errors);
          throw new Error("Error al crear la tarea");
        } else {
          console.log("Nueva ID DE LA tarea:", responseBody.data.createTask);
          // Si la creación de la tarea tiene éxito, sube el archivo
          // obteniendo el id de la tarea creada
          const taskId = responseBody.data.createTask.id;
          await loadFile('#taskFile', taskId);

          tasks = await getTasksByProjectId(projectId);
          showTasksCards(tasks);

          $("#addTaskModal").modal("hide");
          $("#addTaskForm")[0].reset();
          socket.emit('mensaje', "Nueva tarjeta creada");
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
      }
    });

    // Mosrar y ocultar botón de eliminar tarea
    $(document).on("mouseenter", ".task-card", function () {
      $(this).find(".delete-button").show();
    });
    $(document).on("mouseleave", ".task-card", function () {
      $(this).find(".delete-button").hide();
    });

    // Eliminar una tarea
    $(document).on("click", ".delete-button", function (event) {
      event.preventDefault();
      const taskId = $(this).closest(".task-card-btn").data("task-id");
      console.log("Eliminar tarea con ID:", taskId);
      
      $("#confirmationModal").modal("show");

      $("#confirmDelete").click(async function () {
        const mutation = `
          mutation DeleteTask($deleteTaskId: ID!) {
            deleteTask(id: $deleteTaskId)
          }
        `;    
        
        const requestBody = {
          query: mutation,
          variables: {
            deleteTaskId: taskId,
          },
        };  
        
        const response = await fetch("/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        
        const responseBody = await response.json(); 
        try {
          if (responseBody.errors) {
            console.error("Error en GraphQL:", responseBody.errors);
            throw new Error("Error al eliminar la tarea");
          } else {
            console.log("Tarea eliminada:", responseBody.data.deleteTask);
            const updatedTasks = await getTasksByProjectId(projectId);
            showTasksCards(updatedTasks); 

            $("#confirmationModal").modal("hide"); 
            socket.emit('mensaje', "Tarjeta eliminada."); 
          }
        } catch (error) {
          console.error("Error en la solicitud:", error);
        }
      });
      return false;
    });
  }
});
