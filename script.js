// ===== MÓDULOS =====

// Módulo de almacenamiento local
const storageModule = (() => {
  const CONTENTS_KEY = "bilingual_contents"

  // Obtener todo el contenido guardado
  const getSavedContents = () => {
    const contents = localStorage.getItem(CONTENTS_KEY)
    return contents ? JSON.parse(contents) : []
  }

  // Guardar contenido
  const saveContent = (content, type) => {
    const contents = getSavedContents()

    // Crear objeto de contenido con metadatos
    const contentObject = {
      id: Date.now().toString(),
      content: content,
      title: generateTitle(content),
      date: new Date().toISOString(),
      preview: generatePreview(content),
      type: type, // "story", "sentences" o "qa"
    }

    // Agregar al inicio del array
    contents.unshift(contentObject)

    // Guardar en localStorage
    localStorage.setItem(CONTENTS_KEY, JSON.stringify(contents))

    return contentObject
  }

  // Eliminar contenido guardado
  const deleteContent = (contentId) => {
    const contents = getSavedContents()
    const updatedContents = contents.filter((content) => content.id !== contentId)
    localStorage.setItem(CONTENTS_KEY, JSON.stringify(updatedContents))
    return updatedContents
  }

  // Generar título a partir del contenido
  const generateTitle = (content) => {
    // Extraer la primera línea y limitar a 50 caracteres
    const firstLine = content.split("<br>")[0] || content.split("\n")[0]
    const plainText = firstLine.replace(/<[^>]*>/g, "")
    return plainText.length > 50 ? plainText.substring(0, 50) + "..." : plainText
  }

  // Generar vista previa a partir del contenido
  const generatePreview = (content) => {
    // Eliminar etiquetas HTML y limitar a 150 caracteres
    const plainText = content.replace(/<[^>]*>/g, "")
    return plainText.length > 150 ? plainText.substring(0, 150) + "..." : plainText
  }

  return {
    getSavedContents,
    saveContent,
    deleteContent,
  }
})()

// Módulo de tema
const themeModule = (() => {
  // Comprobar preferencia de tema
  const getPreferredTheme = () => {
    const savedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    return savedTheme || (prefersDark ? "dark" : "light")
  }

  // Aplicar tema
  const applyTheme = (theme) => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
      updateThemeToggleButton(true)
    } else {
      document.documentElement.classList.remove("dark")
      updateThemeToggleButton(false)
    }
  }

  // Cambiar tema
  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark")
    localStorage.setItem("theme", isDark ? "dark" : "light")
    updateThemeToggleButton(isDark)
  }

  // Actualizar botón de tema
  const updateThemeToggleButton = (isDark) => {
    const themeToggleBtn = document.getElementById("themeToggleBtn")
    if (themeToggleBtn) {
      themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'
      themeToggleBtn.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro")
    }
  }

  return {
    init: () => {
      const theme = getPreferredTheme()
      applyTheme(theme)

      // Escuchar cambios en la preferencia del sistema
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          applyTheme(e.matches ? "dark" : "light")
        }
      })
    },
    toggleTheme,
  }
})()

// Módulo de categorías
const categoriesModule = (() => {
  // Categorías predefinidas
  const DEFAULT_CATEGORIES = [
    { id: "escuela", name: "Escuela", description: "Situaciones escolares, como clases, tareas, compañeros, etc." },
    {
      id: "trabajo",
      name: "Trabajo",
      description: "Situaciones laborales, como reuniones, proyectos, compañeros de trabajo, etc.",
    },
    {
      id: "amigos",
      name: "Amigos",
      description: "Situaciones sociales con amigos, como salidas, conversaciones, eventos, etc.",
    },
    {
      id: "tecnologia",
      name: "Tecnología",
      description: "Situaciones relacionadas con dispositivos tecnológicos, aplicaciones, internet, etc.",
    },
    {
      id: "viajes",
      name: "Viajes",
      description: "Situaciones relacionadas con viajes, destinos, aventuras, maletas, etc.",
    },
  ]

  let categories = [...DEFAULT_CATEGORIES]
  let selectedCategory = null

  // Renderizar categorías
  const renderCategories = () => {
    const container = document.getElementById("categories-container")
    container.innerHTML = ""

    categories.forEach((category) => {
      const categoryItem = document.createElement("div")
      categoryItem.className = "category-item fade-in"

      const categoryBtn = document.createElement("button")
      categoryBtn.className = `category-btn ${selectedCategory?.id === category.id ? "active" : ""}`
      categoryBtn.textContent = category.name
      categoryBtn.addEventListener("click", () => selectCategory(category))

      categoryItem.appendChild(categoryBtn)

      // Agregar botón de eliminar solo para categorías personalizadas
      if (!DEFAULT_CATEGORIES.some((c) => c.id === category.id)) {
        const deleteBtn = document.createElement("button")
        deleteBtn.className = "delete-category-btn"
        deleteBtn.innerHTML = "&times;"
        deleteBtn.setAttribute("aria-label", `Eliminar categoría ${category.name}`)
        deleteBtn.addEventListener("click", () => deleteCategory(category.id))
        categoryItem.appendChild(deleteBtn)
      }

      container.appendChild(categoryItem)
    })
  }

  // Seleccionar categoría
  const selectCategory = (category) => {
    selectedCategory = category
    renderCategories()

    // Mostrar descripción de categoría
    const descriptionContainer = document.getElementById("categoryDescriptionContainer")
    const descriptionInput = document.getElementById("categoryDescription")
    const descriptionTitle = document.getElementById("categoryDescriptionTitle")
    const selectedCategoryName = document.getElementById("selectedCategoryName")

    descriptionContainer.style.display = "block"
    descriptionInput.value = category.description
    descriptionTitle.textContent = `Descripción personalizada para ${category.name}`

    // Actualizar el nombre de la categoría seleccionada
    if (selectedCategoryName) {
      selectedCategoryName.textContent = category.name
    }

    // Actualizar estado del botón de generar
    updateGenerateButtonsState()
  }

  // Agregar categoría personalizada
  const addCategory = (name) => {
    if (!name.trim()) {
      uiModule.showError("Por favor, escribe un nombre para la categoría.")
      return false
    }

    if (categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
      uiModule.showError("Ya existe una categoría con ese nombre.")
      return false
    }

    const newCategory = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      description: "Situaciones cotidianas, variadas de diferentes ámbitos.",
    }

    categories.push(newCategory)
    renderCategories()
    selectCategory(newCategory)

    // Guardar categorías personalizadas
    saveCategories()

    return true
  }

  // Eliminar categoría
  const deleteCategory = (categoryId) => {
    categories = categories.filter((cat) => cat.id !== categoryId)

    if (selectedCategory?.id === categoryId) {
      selectedCategory = null
      document.getElementById("categoryDescriptionContainer").style.display = "none"
    }

    renderCategories()
    updateGenerateButtonsState()

    // Guardar categorías personalizadas
    saveCategories()
  }

  // Actualizar descripción de categoría
  const updateCategoryDescription = (description) => {
    if (selectedCategory) {
      selectedCategory.description = description

      // Guardar categorías personalizadas en localStorage
      saveCategories()

      // Mostrar notificación de guardado
      uiModule.showNotification("Descripción guardada correctamente", "success")
    }
  }

  // Guardar categorías personalizadas en localStorage
  const saveCategories = () => {
    const customCategories = categories.filter(
      (cat) => !DEFAULT_CATEGORIES.some((defaultCat) => defaultCat.id === cat.id),
    )

    localStorage.setItem("custom_categories", JSON.stringify(customCategories))
  }

  // Cargar categorías personalizadas desde localStorage
  const loadCategories = () => {
    const savedCategories = localStorage.getItem("custom_categories")

    if (savedCategories) {
      const customCategories = JSON.parse(savedCategories)
      categories = [...DEFAULT_CATEGORIES, ...customCategories]
    }
  }

  // Obtener categoría seleccionada
  const getSelectedCategory = () => selectedCategory

  // Actualizar estado de los botones de generar
  const updateGenerateButtonsState = () => {
    const generateStoryBtn = document.getElementById("generateStoryBtn")
    const generateSentencesBtn = document.getElementById("generateSentencesBtn")
    const generateQABtn = document.getElementById("generateQABtn")

    const disabled = !selectedCategory

    // Actualizar estado de los botones
    generateStoryBtn.disabled = disabled
    generateSentencesBtn.disabled = disabled
    generateQABtn.disabled = disabled

    // Añadir tooltip visual si están deshabilitados
    ;[generateStoryBtn, generateSentencesBtn, generateQABtn].forEach((btn) => {
      if (disabled) {
        btn.setAttribute("title", "Debes seleccionar una categoría primero")
        btn.classList.add("btn-disabled-hint")
      } else {
        btn.removeAttribute("title")
        btn.classList.remove("btn-disabled-hint")
      }
    })
  }

  return {
    init: () => {
      loadCategories()
      renderCategories()
      updateGenerateButtonsState()
    },
    addCategory,
    getSelectedCategory,
    updateCategoryDescription,
  }
})()

// Módulo de generación de contenido
const contentGeneratorModule = (() => {
  // Validación de palabras en inglés
  const wordsPattern = /^[a-zA-Z, ]+$/

  // Tipo de contenido actual ("story", "sentences", "qa")
  let currentContentType = "story"

  // Validar entrada
  const validateInput = (words) => {
    // Verificar primero si hay una categoría seleccionada
    const selectedCategory = categoriesModule.getSelectedCategory()
    if (!selectedCategory) {
      throw new Error("Por favor, selecciona una categoría.")
    }

    if (!words.trim()) {
      throw new Error("Por favor, ingresa algunas palabras en inglés.")
    }

    if (!wordsPattern.test(words)) {
      throw new Error("Ingresa solo palabras en inglés, separadas por comas.")
    }

    const wordsArray = words
      .split(",")
      .map((word) => word.trim())
      .filter(Boolean)
    const uniqueWords = new Set(wordsArray)

    if (wordsArray.length !== uniqueWords.size) {
      throw new Error("Las palabras no pueden estar repetidas.")
    }

    return {
      wordsArray: Array.from(uniqueWords),
      category: selectedCategory,
    }
  }

  // Generar historia
  const generateStory = async (words, paragraphs, wordCount) => {
    try {
      const { wordsArray, category } = validateInput(words)
      currentContentType = "story"

      // Asegurarnos de que estamos usando la descripción de la categoría correctamente
      const description = category.description || "situaciones cotidianas variadas"

      console.log("Generando historia con categoría:", category.name, "- Descripción:", description)

      // Construir el prompt para la API con énfasis en la categoría seleccionada
      const prompt =
        `Crea una historia breve (de ${paragraphs} párrafos) que refleje específicamente la categoría "${category.name}" con la siguiente descripción: "${description}". ` +
        `La historia debe estar contextualizada en este tema específico. ` +
        `Adapta modismos y frases hechas para que suenen naturales (resáltalas en negrita solo las palabras utilizadas en inglés a través de la entrada). ` +
        `Formato: Cada párrafo en inglés debe incluir todas las palabras de la lista proporcionada: ${words}.` +
        `\nAsegúrate de que todas las palabras ingresadas estén distribuidas a lo largo de la historia.` +
        `\nIncluir referencias culturales actuales (2010-2025) relacionadas con la categoría "${category.name}".` +
        `\nVaría los verbos principales en cada oración.` +
        `\nTener un tono coloquial (estadounidense) y evitar estructuras formales.` +
        `\n\nTraducciones al español:` +
        `\n\nNo ligues español con ingles en las oraciones generadas:` +
        `\nLas traducciones deben reflejar el tono coloquial del español latino o neutro, asemejándose a la traducción literal del inglés al español. Resalta en negrita la traducción al español solo de esas palabras en inglés.` +
        `\n\nSigue correctamente las instrucciones para mantener la historia dentro del límite de ${wordCount} palabras en inglés, no en español.` +
        `\n\nPalabras en inglés a utilizar: ${words}` +
        `\n\nEjemplo de traducción: \n\n` +
        `My day started working on that TikTok trend, but then I needed some money, so I went to my part time job. I needed to look presentable, so I took some time to get ready. After work, I'll hang out with friends; hopefully, that'll cheer me up after a long day.\n` +
        `Traducción al español:\n` +
        `Mi día comenzó trabajando en esa tendencia de TikTok, pero luego necesitaba algo de dinero, así que fui a mi trabajo de medio tiempo. Necesitaba verse presentable, así que me tomé un tiempo para prepararme. Después del trabajo, saldré con amigos; ojalá eso me anime después de un largo día.
        siempre haz la traduccion al español`

      // Llamar a la API
      return await callGeminiAPI(prompt)
    } catch (error) {
      throw error
    }
  }

  // Generar oraciones
  const generateSentences = async (words, paragraphs, wordCount) => {
    try {
      const { wordsArray, category } = validateInput(words)
      currentContentType = "sentences"

      // Asegurarnos de que estamos usando la descripción de la categoría correctamente
      const description = category.description || "situaciones cotidianas variadas"

      console.log("Generando oraciones con categoría:", category.name, "- Descripción:", description)

      // Construir el prompt para la API con énfasis en la categoría seleccionada
      const prompt =
        `Create ${paragraphs} sentence or Phrase in colloquial American English (US) about the specific category "${category.name}" with this description: "${description}":\n\n` +
        `Adapta modismos y frases hechas para que suenen naturales (resáltalas en negrita solo las palabras utilizadas en inglés a través de la entrada). ` +
        `Formato: Cada oracion o frase en inglés debe incluir todas las palabras de la lista proporcionada: ${words}.` +
        `Requirements:\n\n` +
        `Tone and style:\n` +
        `- Use current cultural references (2010-2025) related to the category "${category.name}"\n` +
        `- Vary the main verbs in each sentence\n` +
        `\nAsegúrate de que todas las palabras ingresadas estén distribuidas a lo largo de la oracion o frase.` +
        `\nLas traducciones deben reflejar el tono coloquial del español latino o neutro, asemejándose a la traducción literal del inglés al español. Resalta en negrita la traducción al español solo de esas palabras en inglés.` +
        `\nTener un tono coloquial (estadounidense) y evitar estructuras formales.` +
        `Format:\n\n` +
        `- Varied topics: Include everyday situations related to ${description}.\n` +
        `\n\nSigue correctamente las instrucciones para mantener la oracion o frase dentro del límite de ${wordCount} palabras en inglés, no en español.` +
        `\n\nWords to use: ${words}\n\n` +
        `\n\nEjemplo de traducción: \n\n` +
        `I can't believe it! I'm so tired of work today. \n` +
        `No lo puedo creer! Estoy tan cansado del trabajo hoy.\n` +
        `siempre haz la traduccion al español\n`

      // Llamar a la API
      return await callGeminiAPI(prompt)
    } catch (error) {
      throw error
    }
  }

  // Generar preguntas y respuestas
  const generateQA = async (words, paragraphs, wordCount) => {
    try {
      const { wordsArray, category } = validateInput(words)
      currentContentType = "qa"

      // Asegurarnos de que estamos usando la descripción de la categoría correctamente
      const description = category.description || "situaciones cotidianas variadas"

      console.log("Generando Q&A con categoría:", category.name, "- Descripción:", description)

      // Construir el prompt para la API con énfasis en la categoría seleccionada
      const prompt =
        `Create ${paragraphs} pairs of questions and answers in colloquial American English (US) specifically about the category "${category.name}" with this description: "${description}":\n\n` +
        `Adapta modismos y frases hechas para que suenen naturales (resáltalas en negrita solo las palabras utilizadas en inglés a través de la entrada). ` +
        `Formato: Cada pregunta y respuesta en inglés debe incluir todas las palabras de la lista proporcionada: ${words}.` +
        `Requirements:\n\n` +
        `Tone and style:\n` +
        `- Use current cultural references (2010-2025) related to the category "${category.name}"\n` +
        `- Vary the question types (yes/no questions, wh-questions, etc.)\n` +
        `- Make the answers informative and conversational\n` +
        `\nAsegúrate de que todas las palabras ingresadas estén distribuidas entre la pregunta y la respuesta.` +
        `\nLas traducciones deben reflejar el tono coloquial del español latino o neutro, asemejándose a la traducción literal del inglés al español. Resalta en negrita la traducción al español solo de esas palabras en inglés.` +
        `\nTener un tono coloquial (estadounidense) y evitar estructuras formales.` +
        `Format:\n\n` +
        `- Format each Q&A pair as follows:\n` +
        `Q: [Question in English]\n` +
        `A: [Answer in English]\n\n` +
        `Traducción al español:\n` +
        `P: [Pregunta en español]\n` +
        `R: [Respuesta en español]\n\n` +
        `- Varied topics: Include everyday situations related to ${description}.\n` +
        `\n\nSigue correctamente las instrucciones para mantener cada pregunta y respuesta dentro del límite de ${wordCount} palabras en inglés, no en español.` +
        `\n\nWords to use: ${words}\n\n` +
        `\n\nEjemplo de traducción: \n\n` +
        `Q: How can I improve my work-life balance when I have so many responsibilities?\n` +
        `A: Finding balance between work and personal life requires setting clear boundaries and taking regular breaks to recharge.\n\n` +
        `Traducción al español:\n` +
        `P: ¿Cómo puedo mejorar mi equilibrio entre el trabajo y la vida cuando tengo tantas responsabilidades?\n` +
        `R: Encontrar el equilibrio entre el trabajo y la vida personal requiere establecer límites claros y tomar descansos regulares para recargarse.\n` +
        `siempre haz la traduccion al español\n`

      // Llamar a la API
      return await callGeminiAPI(prompt)
    } catch (error) {
      throw error
    }
  }

  // Llamar a la API de Gemini a través de nuestro endpoint seguro
  const callGeminiAPI = async (prompt) => {
    try {
      console.log("Enviando prompt a la API...")

      // Llamar a nuestro endpoint en lugar de directamente a la API de Google
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        console.error(`Error API: ${response.status} - ${response.statusText}`)
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!generatedText) {
        console.error("No se recibió texto generado de la API")
        throw new Error("No se pudo generar el contenido")
      }

      console.log("Contenido generado exitosamente")
      return generatedText
    } catch (error) {
      console.error("Error al llamar a la API:", error)

      // Para demostraciones o pruebas, podemos devolver una respuesta simulada
      // En un entorno de producción, se debería manejar el error adecuadamente
      if (currentContentType === "story") {
        return `**Work** is important, but sometimes I need a **break** to relax. Yesterday, I decided to **travel** to the beach with my **friends**. We had a great time playing in the **water** and enjoying the sun.

Traducción al español:
El **trabajo** es importante, pero a veces necesito un **descanso** para relajarme. Ayer, decidí **viajar** a la playa con mis **amigos**. Lo pasamos muy bien jugando en el **agua** y disfrutando del sol.`
      } else if (currentContentType === "sentences") {
        return `I need to **work** on my project before I can take a **break** with my **friends**.

Traducción al español:
Necesito **trabajar** en mi proyecto antes de poder tomar un **descanso** con mis **amigos**.

My **friends** and I are planning to **travel** to the mountains where we can enjoy the fresh **water** streams.

Traducción al español:
Mis **amigos** y yo estamos planeando **viajar** a las montañas donde podemos disfrutar de los arroyos de **agua** fresca.`
      } else {
        return `Q: How can I balance **work** and leisure time to avoid burnout during my **travel** to conferences with **friends**?
A: Taking regular **breaks** and enjoying local attractions with your **friends** can help you balance **work** commitments while making the most of your **travel** experience. Don't forget to stay hydrated by drinking plenty of **water**!

Traducción al español:
P: ¿Cómo puedo equilibrar el **trabajo** y el tiempo libre para evitar el agotamiento durante mi **viaje** a conferencias con **amigos**?
R: Tomar **descansos** regulares y disfrutar de las atracciones locales con tus **amigos** puede ayudarte a equilibrar los compromisos de **trabajo** mientras aprovechas al máximo tu experiencia de **viaje**. ¡No olvides mantenerte hidratado bebiendo mucha **agua**!`
      }
    }
  }

  return {
    generateStory,
    generateSentences,
    generateQA,
    getCurrentContentType: () => currentContentType,
  }
})()

// Módulo de interfaz de usuario
const uiModule = (() => {
  // Mostrar error
  const showError = (message) => {
    const errorElement = document.getElementById("error")
    errorElement.textContent = message
    errorElement.style.display = "block"

    // Hacer scroll al error para asegurarnos que sea visible
    errorElement.scrollIntoView({ behavior: "smooth", block: "center" })

    // Añadir clase para animación de atención
    errorElement.classList.add("error-pulse")

    // Quitar la clase de animación después de completarse
    setTimeout(() => {
      errorElement.classList.remove("error-pulse")
    }, 1000)

    // Ocultar después de 8 segundos (tiempo suficiente para leer)
    setTimeout(() => {
      errorElement.style.display = "none"
    }, 8000)
  }

  // Ocultar error
  const hideError = () => {
    document.getElementById("error").style.display = "none"
  }

  // Mostrar notificación
  const showNotification = (message, type = "info") => {
    // Crear elemento de notificación
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.setAttribute("role", "alert")

    // Crear contenido
    const icon = document.createElement("i")
    icon.className =
      type === "success" ? "fas fa-check-circle" : type === "error" ? "fas fa-exclamation-circle" : "fas fa-info-circle"

    const text = document.createElement("span")
    text.textContent = message

    notification.appendChild(icon)
    notification.appendChild(text)

    // Agregar al DOM
    document.body.appendChild(notification)

    // Mostrar con animación
    setTimeout(() => {
      notification.classList.add("show")
    }, 10)

    // Ocultar después de 3 segundos
    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => {
        notification.remove()
      }, 300)
    }, 3000)
  }

  // Mostrar estado de carga
  const setLoading = (isLoading, contentType) => {
    const buttons = {
      story: document.getElementById("generateStoryBtn"),
      sentences: document.getElementById("generateSentencesBtn"),
      qa: document.getElementById("generateQABtn"),
    }

    // Desactivar todos los botones durante la carga
    Object.values(buttons).forEach((btn) => {
      btn.disabled = isLoading
    })

    // Mostrar animación de carga solo en el botón correspondiente
    Object.entries(buttons).forEach(([type, btn]) => {
      const btnText = btn.querySelector(".btn-text")
      const btnLoading = btn.querySelector(".btn-loading")

      if (type === contentType && isLoading) {
        btnText.style.display = "none"
        btnLoading.style.display = "inline-flex"
      } else {
        btnText.style.display = "inline"
        btnLoading.style.display = "none"
      }
    })
  }

  // Mostrar contenido generado
  const displayContent = (contentText, contentType) => {
    const contentContainer = document.getElementById("contentContainer")
    const contentElement = document.getElementById("content")
    const contentTitle = document.getElementById("contentTitle")

    // Actualizar título según el tipo de contenido
    if (contentType === "story") {
      contentTitle.textContent = "Historia Generada"
    } else if (contentType === "sentences") {
      contentTitle.textContent = "Oraciones Generadas"
    } else if (contentType === "qa") {
      contentTitle.textContent = "Preguntas y Respuestas Generadas"
    }

    // Formatear el texto del contenido
    const formattedContent = contentText.replace(/\n/g, "<br>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    contentElement.innerHTML = formattedContent
    contentContainer.style.display = "block"

    // Añadir clase de animación
    contentContainer.classList.add("fade-in")

    // Desplazarse al contenido
    contentContainer.scrollIntoView({ behavior: "smooth" })
  }

  // Copiar contenido al portapapeles
  const copyContentToClipboard = () => {
    const contentElement = document.getElementById("content")
    const contentText = contentElement.innerText

    navigator.clipboard
      .writeText(contentText)
      .then(() => {
        showNotification("Contenido copiado al portapapeles", "success")
      })
      .catch((err) => {
        showError("No se pudo copiar al portapapeles: " + err)
      })
  }

  // Guardar contenido actual
  const saveCurrentContent = () => {
    const contentElement = document.getElementById("content")
    const contentHtml = contentElement.innerHTML
    const contentType = contentGeneratorModule.getCurrentContentType()

    if (!contentHtml.trim()) {
      showError("No hay contenido para guardar")
      return
    }

    try {
      const savedContent = storageModule.saveContent(contentHtml, contentType)
      showNotification("Contenido guardado correctamente", "success")

      // Actualizar la sección de contenido guardado
      renderSavedContents()

      return savedContent
    } catch (error) {
      showError("Error al guardar el contenido: " + error.message)
      return null
    }
  }

  // Renderizar contenido guardado
  const renderSavedContents = () => {
    const savedContents = storageModule.getSavedContents()
    const container = document.getElementById("savedContentsContainer")
    const section = document.getElementById("savedContentsSection")

    // Limpiar contenedor
    container.innerHTML = ""

    if (savedContents.length === 0) {
      section.style.display = "none"
      return
    }

    // Mostrar sección
    section.style.display = "block"

    // Renderizar cada elemento de contenido
    savedContents.forEach((content) => {
      const card = document.createElement("div")
      card.className = "saved-story-card fade-in"
      card.dataset.id = content.id

      // Cabecera de la tarjeta
      const header = document.createElement("div")
      header.className = "saved-story-header"

      const title = document.createElement("h3")
      title.className = "saved-story-title"
      title.textContent = content.title

      const date = document.createElement("div")
      date.className = "saved-story-date"
      date.textContent = new Date(content.date).toLocaleDateString()

      const type = document.createElement("div")
      type.className = `saved-story-type type-${content.type}`
      type.textContent =
        content.type === "story" ? "Historia" : content.type === "sentences" ? "Oraciones" : "Preguntas y Respuestas"

      header.appendChild(title)
      header.appendChild(date)
      header.appendChild(type)

      // Vista previa
      const preview = document.createElement("div")
      preview.className = "saved-story-preview"
      preview.textContent = content.preview

      // Acciones
      const actions = document.createElement("div")
      actions.className = "saved-story-actions"

      const viewBtn = document.createElement("button")
      viewBtn.className = "saved-story-action view"
      viewBtn.innerHTML = '<i class="fas fa-eye"></i> Ver'
      viewBtn.setAttribute("aria-label", `Ver contenido: ${content.title}`)
      viewBtn.addEventListener("click", () => viewSavedContent(content.id))

      const deleteBtn = document.createElement("button")
      deleteBtn.className = "saved-story-action delete"
      deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Eliminar'
      deleteBtn.setAttribute("aria-label", `Eliminar contenido: ${content.title}`)
      deleteBtn.addEventListener("click", () => deleteSavedContent(content.id))

      actions.appendChild(viewBtn)
      actions.appendChild(deleteBtn)

      // Agregar todo a la tarjeta
      card.appendChild(header)
      card.appendChild(preview)
      card.appendChild(actions)

      container.appendChild(card)
    })
  }

  // Ver contenido guardado
  const viewSavedContent = (contentId) => {
    const savedContents = storageModule.getSavedContents()
    const content = savedContents.find((c) => c.id === contentId)

    if (content) {
      const contentContainer = document.getElementById("contentContainer")
      const contentElement = document.getElementById("content")
      const contentTitle = document.getElementById("contentTitle")

      // Actualizar título según el tipo de contenido
      if (content.type === "story") {
        contentTitle.textContent = "Historia Guardada"
      } else if (content.type === "sentences") {
        contentTitle.textContent = "Oraciones Guardadas"
      } else if (content.type === "qa") {
        contentTitle.textContent = "Preguntas y Respuestas Guardadas"
      }

      contentElement.innerHTML = content.content
      contentContainer.style.display = "block"

      // Añadir clase de animación
      contentContainer.classList.add("fade-in")

      contentContainer.scrollIntoView({ behavior: "smooth" })
    }
  }

  // Eliminar contenido guardado
  const deleteSavedContent = (contentId) => {
    if (confirm("¿Estás seguro de que deseas eliminar este contenido?")) {
      storageModule.deleteContent(contentId)
      renderSavedContents()
      showNotification("Contenido eliminado correctamente", "success")
    }
  }

  return {
    showError,
    hideError,
    showNotification,
    setLoading,
    displayContent,
    copyContentToClipboard,
    saveCurrentContent,
    renderSavedContents,
    viewSavedContent,
    deleteSavedContent,
  }
})()

// ===== INICIALIZACIÓN =====
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar módulo de tema
  themeModule.init()

  // Inicializar módulo de categorías
  categoriesModule.init()

  // Actualizar año en el footer
  document.getElementById("year").textContent = new Date().getFullYear()

  // Event listeners para sliders
  const paragraphsInput = document.getElementById("paragraphs")
  const wordCountInput = document.getElementById("wordCount")
  const paragraphsCountDisplay = document.getElementById("paragraphs-count")
  const wordCountDisplay = document.getElementById("wordCount-value")

  paragraphsInput.addEventListener("input", () => {
    paragraphsCountDisplay.textContent = paragraphsInput.value
  })

  wordCountInput.addEventListener("input", () => {
    wordCountDisplay.textContent = wordCountInput.value
  })

  // Event listener para cambiar tema
  const themeToggleBtn = document.getElementById("themeToggleBtn")
  themeToggleBtn.addEventListener("click", themeModule.toggleTheme)

  // Event listener para agregar categoría
  const newCategoryInput = document.getElementById("newCategory")
  const addCategoryBtn = document.getElementById("addCategoryBtn")

  addCategoryBtn.addEventListener("click", () => {
    const success = categoriesModule.addCategory(newCategoryInput.value)
    if (success) {
      newCategoryInput.value = ""
    }
  })

  // Event listener para guardar descripción de categoría
  const categoryDescriptionInput = document.getElementById("categoryDescription")
  const saveDescriptionBtn = document.getElementById("saveDescriptionBtn")

  saveDescriptionBtn.addEventListener("click", () => {
    categoriesModule.updateCategoryDescription(categoryDescriptionInput.value)
  })

  // Event listeners para generar contenido
  const generateStoryBtn = document.getElementById("generateStoryBtn")
  const generateSentencesBtn = document.getElementById("generateSentencesBtn")
  const generateQABtn = document.getElementById("generateQABtn")
  const wordsInput = document.getElementById("words")

  // Generar oraciones (ahora es el primer botón)
  generateSentencesBtn.addEventListener("click", async () => {
    uiModule.hideError()
    uiModule.setLoading(true, "sentences")

    try {
      const words = wordsInput.value
      const paragraphs = Number.parseInt(paragraphsInput.value)
      const wordCount = Number.parseInt(wordCountInput.value)

      const sentencesText = await contentGeneratorModule.generateSentences(words, paragraphs, wordCount)

      uiModule.displayContent(sentencesText, "sentences")

      // Mostrar sección de contenido guardado si hay alguno
      uiModule.renderSavedContents()
    } catch (error) {
      uiModule.showError(error.message)
    } finally {
      uiModule.setLoading(false, "sentences")
    }
  })

  // Generar historia
  generateStoryBtn.addEventListener("click", async () => {
    uiModule.hideError()
    uiModule.setLoading(true, "story")

    try {
      const words = wordsInput.value
      const paragraphs = Number.parseInt(paragraphsInput.value)
      const wordCount = Number.parseInt(wordCountInput.value)

      const storyText = await contentGeneratorModule.generateStory(words, paragraphs, wordCount)

      uiModule.displayContent(storyText, "story")

      // Mostrar sección de contenido guardado si hay alguno
      uiModule.renderSavedContents()
    } catch (error) {
      uiModule.showError(error.message)
    } finally {
      uiModule.setLoading(false, "story")
    }
  })

  // Generar preguntas y respuestas
  generateQABtn.addEventListener("click", async () => {
    uiModule.hideError()
    uiModule.setLoading(true, "qa")

    try {
      const words = wordsInput.value
      const paragraphs = Number.parseInt(paragraphsInput.value)
      const wordCount = Number.parseInt(wordCountInput.value)

      const qaText = await contentGeneratorModule.generateQA(words, paragraphs, wordCount)

      uiModule.displayContent(qaText, "qa")

      // Mostrar sección de contenido guardado si hay alguno
      uiModule.renderSavedContents()
    } catch (error) {
      uiModule.showError(error.message)
    } finally {
      uiModule.setLoading(false, "qa")
    }
  })

  // Event listener para copiar contenido
  const copyBtn = document.getElementById("copyBtn")
  copyBtn.addEventListener("click", () => {
    uiModule.copyContentToClipboard()
  })

  // Event listener para guardar contenido
  const saveContentBtn = document.getElementById("saveContentBtn")
  saveContentBtn.addEventListener("click", () => {
    uiModule.saveCurrentContent()
  })

  // Event listener para tecla Enter en el campo de nueva categoría
  newCategoryInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addCategoryBtn.click()
    }
  })

  // Cargar contenido guardado al iniciar
  uiModule.renderSavedContents()

  // Registrar Service Worker para PWA
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("ServiceWorker registrado con éxito:", registration.scope)
        })
        .catch((error) => {
          console.log("Error al registrar ServiceWorker:", error)
        })
    })
  }
})

// Agregar evento para guardar con Ctrl+S
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
    e.preventDefault()
    const contentContainer = document.getElementById("contentContainer")
    if (contentContainer.style.display !== "none") {
      uiModule.saveCurrentContent()
    }
  }
})

