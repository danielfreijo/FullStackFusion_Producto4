let tasks

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
      console.log("Tareas encontradas:", responseBody.data.getTasksByProjectId);
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
      console.log("Tarea actualizada:", responseBody.data.updateTask);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  }
}
async function updateTaskStateInProject(taskId, newState) {
  const projectId = new URLSearchParams(window.location.search).get("id");
  
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
      console.log('Tarea actualizada:', responseBody.data.updateTask);
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
      console.log("Proyecto actualizado:", responseBody.data.updateProject);
    }
  } catch (error) {
    console.error("Error en la solicitud:", error);
  }
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
  // Crear una imagen personalizada para el icono de arrastre
  var dragIcon = document.createElement('img');
  dragIcon.src = 'http://localhost:4000/assets/copy.png';
  dragIcon.width = 90;
  dragIcon.style.opacity = 0.5;
  dragIcon.style.position = 'absolute'; 
  dragIcon.style.left = '0'; 
  dragIcon.style.top = '0';

  // Añade el dragIcon al cuerpo del documento para garantizar su visibilidad durante el arrastre
  document.body.appendChild(dragIcon);

  // Establece el dragIcon como el icono de arrastre con un desplazamiento personalizado
  event.dataTransfer.setDragImage(dragIcon, 10, 10);

  // Elimina el dragIcon del cuerpo del documento después del arrastre
  setTimeout(() => {
      document.body.removeChild(dragIcon);
  }, 0);
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
  console.log("ID del proyecto:", projectId);

  const project = await getProjectById(projectId);
  console.log("Proyecto encontrado:", project);

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

    // Mostrar el tipo de fondo seleccionado
    $("#sidebarBackgroundType").change(function () {
      var selectedType = $(this).val();
      if (selectedType === "color") {
        $("#colorSection").show();
        $("#imageSection").hide();
        $("#sidebarBackgroundImage").val("");
        //console.log('Imagen de fondo:', $('#sidebarBackgroundImage').val());
      } else {
        $("#colorSection").hide();
        $("#imageSection").show();
        $("#sidebarBackgroundColor").val("#ffffff");
        //console.log('Color de fondo:', $('#sidebarBackgroundColor').val());
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
        $("#sidebarBackgroundColorCard").val("#ffffff");
        //console.log('Color de fondo:', $('#sidebarBackgroundColorCard').val());
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
      const newBackgroundImageCard =
        $("#sidebarBackgroundImageCard").val() || "";

      /* Si se selecciona un color como fondo, establecer backgroundImage como ""
      if (newBackgroundImage === "") {
        newBackgroundImage = "";
      }
      if (newBackgroundImageCard === "") {
        newBackgroundImageCard = "";
      }*/

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
      //console.log('Cuerpo de la solicitud:', requestBody);

      try {
        const response = await fetch("/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });
        //console.log('Respuesta de la API:', response);

        const responseBody = await response.json();
        if (responseBody.errors) {
          console.error("Error en GraphQL:", responseBody.errors);
          throw new Error("Error al actualizar el proyecto");
        } else {
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
    });

    // Evento al hacer clic en una tarea
    $(document).on("click", ".task-card-btn", function (event) {
      event.stopPropagation();

      const taskId = $(this).data("task-id");
      //console.log("ID de la tarea:", taskId);
      const taskToEdit = tasks.find(
        (task) => task.id.toString() === taskId.toString()
      );
      console.log("Tarea a editar:", taskToEdit);

      const editDate = new Date(parseInt(taskToEdit.enddate, 10));
      const year = editDate.getFullYear();
      const month = editDate.getMonth() + 1;
      const day = editDate.getDate();
      const formattedDate = `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;

      console.log('Estado:', taskToEdit.status);

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
          console.log("Tarea actualizada:", responseBody.data.updateTask);
          tasks = await getTasksByProjectId(projectId);
          showTasksCards(tasks);
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
      }
      
      // Cierra el modal
      $("#editTaskModal").modal("hide");
      
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
      console.log("Datos de la tarea:", taskData);
      //console.log('Fecha', taskData.enddate);

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
          //console.log('Respuesta de la API:', response);
          //console.log('Cuerpo de la solicitud:', requestBody);
          //console.log('Respuesta del cuerpo:', responseBody);
          console.error("Error en GraphQL:", responseBody.errors);
          throw new Error("Error al crear la tarea");
        } else {
          console.log("Nueva tarea:", taskData);
          tasks = await getTasksByProjectId(projectId);
          showTasksCards(tasks);
          $("#addTaskModal").modal("hide");
          $("#addTaskForm")[0].reset();
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
          }
        } catch (error) {
          console.error("Error en la solicitud:", error);
        }
      });

      return false;
    });
  }
});
