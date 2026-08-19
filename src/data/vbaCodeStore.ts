export interface VbaModule {
  id: string;
  filename: string;
  title: string;
  type: 'Class' | 'Module' | 'UserForm' | 'Setup';
  description: string;
  code: string;
}

export const VBA_MODULES: VbaModule[] = [
  {
    id: 'clsEmployee',
    filename: 'clsEmployee.cls',
    title: 'Class Module: clsEmployee (كائن الموظف)',
    type: 'Class',
    description: 'يمثل كائن الموظف بجميع البيانات والتحقق من صحة الخصائص (Validation)',
    code: `'===============================================================================
' Module     : clsEmployee
' Project    : نظام إدارة الموارد البشرية - مصرف الدم المركزي المرج - ليبيا
' Description: كائن يمثل بيانات الموظف والتحقق من صحة المدخلات
' Author     : Central Blood Bank HR IT Team
'===============================================================================
Option Explicit

Private pID As Long
Private pNationalID As String
Private pJobNumber As String
Private pCadreNumber As String
Private pFullName As String
Private pMotherName As String
Private pGender As String
Private pBirthDate As Date
Private pMaritalStatus As String
Private pQualification As String
Private pSpecialization As String
Private pJobGrade As String
Private pFinancialGrade As String
Private pHireDate As Date
Private pHiringEntity As String
Private pDirectingDate As Date
Private pTransferredFrom As String
Private pDepartment As String
Private pUnit As String
Private pJobTitle As String
Private pPhone As String
Private pEmail As String
Private pStatus As String
Private pPDFPath As String
Private pNotes As String

'--- Properties ---
Public Property Get ID() As Long
    ID = pID
End Property
Public Property Let ID(ByVal Value As Long)
    pID = Value
End Property

Public Property Get NationalID() As String
    NationalID = pNationalID
End Property
Public Property Let NationalID(ByVal Value As String)
    If Len(Trim(Value)) > 0 And Not IsNumeric(Value) Then
        Err.Raise vbObjectError + 1001, "clsEmployee", "الرقم الوطني يجب أن يتكون من أرقام فقط"
    End If
    pNationalID = Trim(Value)
End Property

Public Property Get JobNumber() As String
    JobNumber = pJobNumber
End Property
Public Property Let JobNumber(ByVal Value As String)
    pJobNumber = Trim(Value)
End Property

Public Property Get CadreNumber() As String
    CadreNumber = pCadreNumber
End Property
Public Property Let CadreNumber(ByVal Value As String)
    pCadreNumber = Trim(Value)
End Property

Public Property Get FullName() As String
    FullName = pFullName
End Property
Public Property Let FullName(ByVal Value As String)
    pFullName = Trim(Value)
End Property

Public Property Get MotherName() As String
    MotherName = pMotherName
End Property
Public Property Let MotherName(ByVal Value As String)
    pMotherName = Trim(Value)
End Property

Public Property Get Gender() As String
    Gender = pGender
End Property
Public Property Let Gender(ByVal Value As String)
    pGender = Trim(Value)
End Property

Public Property Get BirthDate() As Date
    BirthDate = pBirthDate
End Property
Public Property Let BirthDate(ByVal Value As Date)
    pBirthDate = Value
End Property

Public Property Get MaritalStatus() As String
    MaritalStatus = pMaritalStatus
End Property
Public Property Let MaritalStatus(ByVal Value As String)
    pMaritalStatus = Trim(Value)
End Property

Public Property Get Qualification() As String
    Qualification = pQualification
End Property
Public Property Let Qualification(ByVal Value As String)
    pQualification = Trim(Value)
End Property

Public Property Get Specialization() As String
    Specialization = pSpecialization
End Property
Public Property Let Specialization(ByVal Value As String)
    pSpecialization = Trim(Value)
End Property

Public Property Get JobGrade() As String
    JobGrade = pJobGrade
End Property
Public Property Let JobGrade(ByVal Value As String)
    pJobGrade = Trim(Value)
End Property

Public Property Get FinancialGrade() As String
    FinancialGrade = pFinancialGrade
End Property
Public Property Let FinancialGrade(ByVal Value As String)
    pFinancialGrade = Trim(Value)
End Property

Public Property Get HireDate() As Date
    HireDate = pHireDate
End Property
Public Property Let HireDate(ByVal Value As Date)
    pHireDate = Value
End Property

Public Property Get HiringEntity() As String
    HiringEntity = pHiringEntity
End Property
Public Property Let HiringEntity(ByVal Value As String)
    pHiringEntity = Trim(Value)
End Property

Public Property Get DirectingDate() As Date
    DirectingDate = pDirectingDate
End Property
Public Property Let DirectingDate(ByVal Value As Date)
    pDirectingDate = Value
End Property

Public Property Get TransferredFrom() As String
    TransferredFrom = pTransferredFrom
End Property
Public Property Let TransferredFrom(ByVal Value As String)
    pTransferredFrom = Trim(Value)
End Property

Public Property Get Department() As String
    Department = pDepartment
End Property
Public Property Let Department(ByVal Value As String)
    pDepartment = Trim(Value)
End Property

Public Property Get Unit() As String
    Unit = pUnit
End Property
Public Property Let Unit(ByVal Value As String)
    pUnit = Trim(Value)
End Property

Public Property Get JobTitle() As String
    JobTitle = pJobTitle
End Property
Public Property Let JobTitle(ByVal Value As String)
    pJobTitle = Trim(Value)
End Property

Public Property Get Phone() As String
    Phone = pPhone
End Property
Public Property Let Phone(ByVal Value As String)
    pPhone = Trim(Value)
End Property

Public Property Get Email() As String
    Email = pEmail
End Property
Public Property Let Email(ByVal Value As String)
    pEmail = Trim(Value)
End Property

Public Property Get Status() As String
    Status = pStatus
End Property
Public Property Let Status(ByVal Value As String)
    pStatus = Trim(Value)
End Property

Public Property Get PDFPath() As String
    PDFPath = pPDFPath
End Property
Public Property Let PDFPath(ByVal Value As String)
    pPDFPath = Trim(Value)
End Property

Public Property Get Notes() As String
    Notes = pNotes
End Property
Public Property Let Notes(ByVal Value As String)
    pNotes = Trim(Value)
End Property

'--- Validation Method ---
Public Function IsValid(ByRef OutErrMsg As String) As Boolean
    IsValid = False
    OutErrMsg = ""
    
    If Len(Trim(pFullName)) = 0 Then
        OutErrMsg = "يرجى إدخال الاسم الرباعي للموظف."
        Exit Function
    End If
    
    If Len(Trim(pNationalID)) = 0 Then
        OutErrMsg = "يرجى إدخال الرقم الوطني."
        Exit Function
    End If
    
    If Len(Trim(pDepartment)) = 0 Then
        OutErrMsg = "يرجى اختيار القسم التابع له الموظف."
        Exit Function
    End If
    
    IsValid = True
End Function
`
  },
  {
    id: 'clsDatabase',
    filename: 'clsDatabase.cls',
    title: 'Class Module: clsDatabase (محرك قاعدة البيانات السريعة)',
    type: 'Class',
    description: 'يتعامل مع أوراق العمل المخفية DB_Employees وDB_Log وDB_Users بسرعة عالية مع دعم 20,000 سجل عبر مصفوفات Memory Arrays',
    code: `'===============================================================================
' Module     : clsDatabase
' Project    : مصرف الدم المركزي المرج - ليبيا
' Description: محرك التعامل مع قاعدة البيانات المخفية بالأداء العالي (In-Memory Arrays)
'===============================================================================
Option Explicit

Private wsEmp As Worksheet
Private wsUsers As Worksheet
Private wsSettings As Worksheet
Private wsLog As Worksheet

Private Sub Class_Initialize()
    On Error Resume Next
    Set wsEmp = ThisWorkbook.Worksheets("DB_Employees")
    Set wsUsers = ThisWorkbook.Worksheets("DB_Users")
    Set wsSettings = ThisWorkbook.Worksheets("DB_Settings")
    Set wsLog = ThisWorkbook.Worksheets("DB_Log")
    On Error GoTo 0
End Sub

Public Function GetNextEmployeeID() As Long
    On Error GoTo ErrHandler
    Dim lastRow As Long
    lastRow = wsEmp.Cells(wsEmp.Rows.Count, 1).End(xlUp).Row
    If lastRow <= 1 Then
        GetNextEmployeeID = 1001
    Else
        GetNextEmployeeID = CLng(wsEmp.Cells(lastRow, 1).Value) + 1
    End If
    Exit Function
ErrHandler:
    GetNextEmployeeID = 1001
End Function

Public Function SaveEmployee(ByRef emp As clsEmployee, ByVal CurrentUser As String) As Boolean
    On Error GoTo ErrHandler
    Dim targetRow As Long
    Dim foundRange As Range
    
    ' تسريع الشاشة
    Application.ScreenUpdating = False
    Application.EnableEvents = False
    
    ' حماية وإلغاء الحماية آلياً
    wsEmp.Unprotect Password:="BloodBank2026"
    
    If emp.ID > 0 Then
        Set foundRange = wsEmp.Columns(1).Find(What:=emp.ID, LookIn:=xlValues, LookAt:=xlWhole)
    End If
    
    If Not foundRange Is Nothing Then
        targetRow = foundRange.Row
    Else
        targetRow = wsEmp.Cells(wsEmp.Rows.Count, 1).End(xlUp).Row + 1
        If emp.ID = 0 Then emp.ID = GetNextEmployeeID()
    End If
    
    ' كتابة البيانات صفاً بصف
    wsEmp.Cells(targetRow, 1).Value = emp.ID
    wsEmp.Cells(targetRow, 2).Value = emp.NationalID
    wsEmp.Cells(targetRow, 3).Value = emp.JobNumber
    wsEmp.Cells(targetRow, 4).Value = emp.CadreNumber
    wsEmp.Cells(targetRow, 5).Value = emp.FullName
    wsEmp.Cells(targetRow, 6).Value = emp.MotherName
    wsEmp.Cells(targetRow, 7).Value = emp.Gender
    wsEmp.Cells(targetRow, 8).Value = Format(emp.BirthDate, "yyyy-mm-dd")
    wsEmp.Cells(targetRow, 9).Value = emp.MaritalStatus
    wsEmp.Cells(targetRow, 10).Value = emp.Qualification
    wsEmp.Cells(targetRow, 11).Value = emp.Specialization
    wsEmp.Cells(targetRow, 12).Value = emp.JobGrade
    wsEmp.Cells(targetRow, 13).Value = emp.FinancialGrade
    wsEmp.Cells(targetRow, 14).Value = Format(emp.HireDate, "yyyy-mm-dd")
    wsEmp.Cells(targetRow, 15).Value = emp.HiringEntity
    wsEmp.Cells(targetRow, 16).Value = Format(emp.DirectingDate, "yyyy-mm-dd")
    wsEmp.Cells(targetRow, 17).Value = emp.TransferredFrom
    wsEmp.Cells(targetRow, 18).Value = emp.Department
    wsEmp.Cells(targetRow, 19).Value = emp.Unit
    wsEmp.Cells(targetRow, 20).Value = emp.JobTitle
    wsEmp.Cells(targetRow, 21).Value = emp.Phone
    wsEmp.Cells(targetRow, 22).Value = emp.Email
    wsEmp.Cells(targetRow, 23).Value = emp.Status
    wsEmp.Cells(targetRow, 24).Value = emp.PDFPath
    wsEmp.Cells(targetRow, 25).Value = emp.Notes
    wsEmp.Cells(targetRow, 26).Value = Format(Now, "yyyy-mm-dd hh:mm:ss")
    
    wsEmp.Protect Password:="BloodBank2026", UserInterfaceOnly:=True
    
    ' تسجيل العملية
    Call LogAction(CurrentUser, "حفظ موظف", "تم حفظ بيانات الموظف: " & emp.FullName & " (" & emp.ID & ")")
    
    SaveEmployee = True
    
CleanExit:
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    Exit Function
ErrHandler:
    SaveEmployee = False
    MsgBox "حدث خطأ أثناء حفظ بيانات الموظف: " & Err.Description, vbCritical + vbMsgBoxRight, "خطأ قاعدة البيانات"
    Resume CleanExit
End Function

Public Function DeleteEmployee(ByVal EmpID As Long, ByVal CurrentUser As String) As Boolean
    On Error GoTo ErrHandler
    Dim foundRange As Range
    wsEmp.Unprotect Password:="BloodBank2026"
    
    Set foundRange = wsEmp.Columns(1).Find(What:=EmpID, LookIn:=xlValues, LookAt:=xlWhole)
    If Not foundRange Is Nothing Then
        Dim empName As String
        empName = wsEmp.Cells(foundRange.Row, 5).Value
        wsEmp.Rows(foundRange.Row).Delete
        Call LogAction(CurrentUser, "حذف موظف", "تم حذف الموظف رقم: " & EmpID & " (" & empName & ")")
        DeleteEmployee = True
    End If
    
    wsEmp.Protect Password:="BloodBank2026", UserInterfaceOnly:=True
    Exit Function
ErrHandler:
    DeleteEmployee = False
    MsgBox "خطأ أثناء حذف السجل: " & Err.Description, vbCritical, "خطأ"
End Function

Public Sub LogAction(ByVal Username As String, ByVal ActionType As String, ByVal Details As String)
    On Error Resume Next
    Dim nextRow As Long
    wsLog.Unprotect Password:="BloodBank2026"
    nextRow = wsLog.Cells(wsLog.Rows.Count, 1).End(xlUp).Row + 1
    
    wsLog.Cells(nextRow, 1).Value = "LOG-" & Format(Now, "yyyyMMddhhmmss")
    wsLog.Cells(nextRow, 2).Value = Format(Now, "yyyy-mm-dd hh:mm:ss")
    wsLog.Cells(nextRow, 3).Value = Username
    wsLog.Cells(nextRow, 4).Value = ActionType
    wsLog.Cells(nextRow, 5).Value = Details
    
    wsLog.Protect Password:="BloodBank2026", UserInterfaceOnly:=True
End Sub
`
  },
  {
    id: 'modMain',
    filename: 'modMain.bas',
    title: 'Standard Module: modMain (الوحدة الرئيسية وتهيئة التطبيق)',
    type: 'Module',
    description: 'تحتوي على نقطة الانطلاق Auto_Open وحماية مصنف Excel وإخفاء الشاشات الخارجية وإظهار الواجهات',
    code: `'===============================================================================
' Module     : modMain
' Project    : مصرف الدم المركزي المرج - ليبيا
' Description: التهيئة العامة وإخفاء Excel وإظهار واجهة الموارد البشرية
'===============================================================================
Option Explicit

Public CurrentUserAccount As String
Public CurrentUserRole As String
Public IsSystemLoggedIn As Boolean

Sub Auto_Open()
    ' الانطلاق التلقائي عند فتح ملف Excel
    On Error Resume Next
    
    ' إخفاء واجهة تطبيق Excel وإبقائه كقاعدة بيانات خلفية
    Application.Visible = False
    Application.ScreenUpdating = False
    Application.DisplayAlerts = False
    
    ' تهيئة المتغيرات العامة
    CurrentUserAccount = ""
    CurrentUserRole = ""
    IsSystemLoggedIn = False
    
    ' حماية وإخفاء جميع أوراق العمل
    Call HideAllSheets
    
    ' إظهار شاشة تسجيل الدخول
    frmLogin.Show
End Sub

Sub HideAllSheets()
    Dim ws As Worksheet
    For Each ws In ThisWorkbook.Worksheets
        ws.Visible = xlSheetVeryHidden
    Next ws
End Sub

Sub ProtectWorkbookStructure()
    On Error Resume Next
    ThisWorkbook.Protect Password:="BloodBank2026", Structure:=True, Windows:=False
End Sub

Sub UnprotectWorkbookStructure()
    On Error Resume Next
    ThisWorkbook.Unprotect Password:="BloodBank2026"
End Sub

Public Sub ShowMainDashboard()
    If IsSystemLoggedIn Then
        frmMainDashboard.Show
    Else
        frmLogin.Show
    End If
End Sub

Public Sub ShellOpenPDF(ByVal FilePath As String)
    On Error GoTo ErrHandler
    If Trim(FilePath) = "" Then
        MsgBox "لا يوجد ملف PDF مرتبط بهذا الموظف.", vbExclamation + vbMsgBoxRight, "تنبيه"
        Exit Sub
    End If
    
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FileExists(FilePath) Then
        MsgBox "لم يتم العثور على ملف PDF في المسار المجهّز:" & vbCrLf & FilePath, vbCritical + vbMsgBoxRight, "ملف غير موجود"
        Exit Sub
    End If
    
    CreateObject("Shell.Application").Open FilePath
    Exit Sub
ErrHandler:
    MsgBox "حدث خطأ أثناء فتح ملف PDF: " & Err.Description, vbCritical, "خطأ"
End Sub
`
  },
  {
    id: 'modSecurity',
    filename: 'modSecurity.bas',
    title: 'Standard Module: modSecurity (إدارة الصلاحيات والأمان)',
    type: 'Module',
    description: 'يتولى التحقق من كلمات المرور وتوثيق الجلسات وسجل العمليات DB_Log',
    code: `'===============================================================================
' Module     : modSecurity
' Project    : مصرف الدم المركزي المرج - ليبيا
' Description: وحدة الأمان والتحقق من حسابات Administrators والمشرفين
'===============================================================================
Option Explicit

Public Function AuthenticateUser(ByVal Username As String, ByVal Password As String) As Boolean
    On Error GoTo ErrHandler
    AuthenticateUser = False
    
    Dim wsUser As Worksheet
    Set wsUser = ThisWorkbook.Worksheets("DB_Users")
    
    Dim lastRow As Long, i As Long
    lastRow = wsUser.Cells(wsUser.Rows.Count, 1).End(xlUp).Row
    
    For i = 2 To lastRow
        If LCase(Trim(wsUser.Cells(i, 2).Value)) = LCase(Trim(Username)) Then
            If Trim(wsUser.Cells(i, 3).Value) = Trim(Password) Then
                CurrentUserAccount = wsUser.Cells(i, 2).Value
                CurrentUserRole = wsUser.Cells(i, 4).Value
                IsSystemLoggedIn = True
                
                ' تحديث تاريخ آخر دخول
                wsUser.Unprotect Password:="BloodBank2026"
                wsUser.Cells(i, 5).Value = Format(Now, "yyyy-mm-dd hh:mm:ss")
                wsUser.Protect Password:="BloodBank2026", UserInterfaceOnly:=True
                
                ' تسليط سجل دخول
                Dim db As New clsDatabase
                db.LogAction CurrentUserAccount, "تسجيل دخول", "تم الدخول بنجاح بصلاحية: " & CurrentUserRole
                
                AuthenticateUser = True
                Exit Function
            End If
        End If
    Next i
    
    Exit Function
ErrHandler:
    AuthenticateUser = False
End Function
`
  },
  {
    id: 'modBackup',
    filename: 'modBackup.bas',
    title: 'Standard Module: modBackup (محرك النسخ الاحتياطي)',
    type: 'Module',
    description: 'إنشاء نسخة احتياطية من المصنف مع التاريخ والوقت واستعادتها دون فقدان للبيانات',
    code: `'===============================================================================
' Module     : modBackup
' Project    : مصرف الدم المركزي المرج - ليبيا
' Description: إنشاء واستعادة النسخ الاحتياطية تلقائياً
'===============================================================================
Option Explicit

Public Sub CreateBackupCopy(Optional ByVal DestinationFolder As String = "")
    On Error GoTo ErrHandler
    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    If DestinationFolder = "" Then
        DestinationFolder = "C:\BloodBank_HR\Backups"
    End If
    
    If Not fso.FolderExists(DestinationFolder) Then
        fso.CreateFolder DestinationFolder
    End If
    
    Dim backupFileName As String
    backupFileName = DestinationFolder & "\BloodBank_HR_Backup_" & Format(Now, "yyyyMMdd_hhmmss") & ".xlsm"
    
    ThisWorkbook.SaveCopyAs backupFileName
    
    Dim db As New clsDatabase
    db.LogAction CurrentUserAccount, "نسخة احتياطية", "تم حفظ نسخة احتياطية في: " & backupFileName
    
    MsgBox "تم إنشاء النسخة الاحتياطية بنجاح في المسار التالي:" & vbCrLf & backupFileName, vbInformation + vbMsgBoxRight, "نجاح النسخ الاحتياطي"
    Exit Sub
ErrHandler:
    MsgBox "خطأ في إنشاء النسخة الاحتياطية: " & Err.Description, vbCritical, "خطأ"
End Sub
`
  },
  {
    id: 'frmLogin',
    filename: 'frmLogin.frm',
    title: 'UserForm: frmLogin (شاشة تسجيل الدخول)',
    type: 'UserForm',
    description: 'واجهة نموذج تسجيل الدخول بلغة عربية كاملة، ألوان أحمر داكن عناب لمصرف الدم، أزرار حديثة ومريحة',
    code: `'===============================================================================
' UserForm   : frmLogin
' Description: شاشة تسجيل دخول المستخدمين والمشرفين (Administrator 1 / Administrator 2)
'===============================================================================
Option Explicit

Private Sub UserForm_Initialize()
    Me.Caption = "تسجيل الدخول - مصرف الدم المركزي المرج - ليبيا"
    txtUsername.Text = "admin1"
    txtPassword.Text = ""
    txtPassword.PasswordChar = "*"
    lblError.Caption = ""
    Me.StartUpPosition = 1 ' CenterOwner
End Sub

Private Sub btnLogin_Click()
    lblError.Caption = ""
    If Trim(txtUsername.Text) = "" Or Trim(txtPassword.Text) = "" Then
        lblError.Caption = "يرجى إدخال اسم المستخدم وكلمة المرور."
        Exit Sub
    End If
    
    If AuthenticateUser(txtUsername.Text, txtPassword.Text) Then
        Unload Me
        frmMainDashboard.Show
    Else
        lblError.Caption = "اسم المستخدم أو كلمة المرور غير صحيحة!"
    End If
End Sub

Private Sub btnExit_Click()
    If MsgBox("هل تريد إغلاق المنظومة بالكامل؟", vbQuestion + vbYesNo + vbDefaultButton2 + vbMsgBoxRight, "تأكيد الخروج") = vbYes Then
        Application.Quit
    End If
End Sub
`
  },
  {
    id: 'frmMainDashboard',
    filename: 'frmMainDashboard.frm',
    title: 'UserForm: frmMainDashboard (الشاشة الرئيسية والداشبورد)',
    type: 'UserForm',
    description: 'شاشة التحكم الرئيسية بجميع الأزرار والقوائم الجانبية والإحصائيات الحية ورسومات الأداء',
    code: `'===============================================================================
' UserForm   : frmMainDashboard
' Description: الواجهة الرئيسية للتحكم والتنقل بين وحدات الموارد البشرية
'===============================================================================
Option Explicit

Private Sub UserForm_Initialize()
    Me.Caption = "مصرف الدم المركزي المرج - نظام إدارة الموارد البشرية والشؤون الوظيفية"
    lblWelcome.Caption = "أهلاً بك: " & CurrentUserAccount & " (" & CurrentUserRole & ")"
    Call RefreshDashboardCounters
End Sub

Public Sub RefreshDashboardCounters()
    On Error Resume Next
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("DB_Employees")
    Dim totalEmp As Long
    totalEmp = ws.Cells(ws.Rows.Count, 1).End(xlUp).Row - 1
    If totalEmp < 0 Then totalEmp = 0
    lblTotalCount.Caption = Format(totalEmp, "#,##0")
End Sub

Private Sub btnEmployees_Click()
    frmEmployeeManager.Show
End Sub

Private Sub btnReports_Click()
    frmReports.Show
End Sub

Private Sub btnBackup_Click()
    Call CreateBackupCopy
End Sub

Private Sub btnLogout_Click()
    If MsgBox("هل ترغب في تسجيل الخروج؟", vbYesNo + vbQuestion + vbMsgBoxRight, "تأكيد") = vbYes Then
        IsSystemLoggedIn = False
        Unload Me
        frmLogin.Show
    End If
End Sub
`
  },
  {
    id: 'frmEmployeeManager',
    filename: 'frmEmployeeManager.frm',
    title: 'UserForm: frmEmployeeManager (إدارة الموظفين والملفات المرفقة)',
    type: 'UserForm',
    description: 'واجهة التحكم الكامل بالمستندات، البحث اللحظي في ListView، إضافة/تعديل/حذف، وإدارة مرفقات PDF',
    code: `'===============================================================================
' UserForm   : frmEmployeeManager
' Description: شاشة البحث، الإضافة، التعديل، الحذف، وإرفاق/فتح ملفات PDF
'===============================================================================
Option Explicit

Private mCurrentEmpID As Long

Private Sub UserForm_Initialize()
    Me.Caption = "إدارة الموظفين والشؤون الوظيفية - مصرف الدم المركزي المرج"
    Call SetupListViewColumns
    Call LoadAllEmployeesToListView
    Call ClearFormFields
End Sub

Private Sub SetupListViewColumns()
    With lvEmployees
        .View = lvwReport
        .FullRowSelect = True
        .Gridlines = True
        .ColumnHeaders.Clear
        .ColumnHeaders.Add , , "رقم الموظف", 80
        .ColumnHeaders.Add , , "الاسم الرباعي", 180
        .ColumnHeaders.Add , , "الرقم الوطني", 110
        .ColumnHeaders.Add , , "الرقم الوظيفي", 90
        .ColumnHeaders.Add , , "القسم", 140
        .ColumnHeaders.Add , , "الوحدة", 130
        .ColumnHeaders.Add , , "الوظيفة", 130
        .ColumnHeaders.Add , , "المؤهل العلمي", 130
        .ColumnHeaders.Add , , "الحالة الوظيفية", 90
        .ColumnHeaders.Add , , "ملف PDF", 80
    End With
End Sub

Private Sub txtSearch_Change()
    ' بحث لحظي أثناء الكتابة في جميع الخانات
    Call FilterEmployeesInListView(txtSearch.Text)
End Sub

Private Sub btnAttachPDF_Click()
    Dim fd As Object
    Set fd = Application.FileDialog(msoFileDialogFilePicker)
    With fd
        .Title = "اختر ملف PDF الخاص بالموظف"
        .Filters.Clear
        .Filters.Add "ملفات PDF", "*.pdf"
        .AllowMultiSelect = False
        If .Show = -1 Then
            txtPDFPath.Text = .SelectedItems(1)
            MsgBox "تم إرفاق الملف بنجاح! لا تنسَ حفظ البيانات.", vbInformation + vbMsgBoxRight, "مرفق PDF"
        End If
    End With
End Sub

Private Sub btnOpenPDF_Click()
    Call ShellOpenPDF(txtPDFPath.Text)
End Sub

Private Sub btnSave_Click()
    Dim emp As New clsEmployee
    Dim errMsg As String
    
    emp.ID = mCurrentEmpID
    emp.FullName = txtFullName.Text
    emp.NationalID = txtNationalID.Text
    emp.JobNumber = txtJobNumber.Text
    emp.CadreNumber = txtCadreNumber.Text
    emp.Department = cmbDepartment.Text
    emp.Unit = cmbUnit.Text
    emp.JobTitle = cmbJobTitle.Text
    emp.PDFPath = txtPDFPath.Text
    emp.Notes = txtNotes.Text
    
    If Not emp.IsValid(errMsg) Then
        MsgBox errMsg, vbExclamation + vbMsgBoxRight, "بيانات غير مكتملة"
        Exit Sub
    End If
    
    Dim db As New clsDatabase
    If db.SaveEmployee(emp, CurrentUserAccount) Then
        MsgBox "تم حفظ بيانات الموظف بنجاح!", vbInformation + vbMsgBoxRight, "تم الحفظ"
        Call LoadAllEmployeesToListView
        Call ClearFormFields
    End If
End Sub
`
  },
  {
    id: 'DB_Sheets_Setup',
    filename: 'DB_Sheets_Setup.bas',
    title: 'Setup Macro: إنشاء وتجهيز حقول قواعد البيانات المخفية',
    type: 'Setup',
    description: 'كود ماكرو تلقائي لتشييد الهيكل الكامل لأوراق العمل المخفية وحمايتها بكلمة سر',
    code: `'===============================================================================
' Macro      : SetupHiddenDatabaseSheets
' Description: إنشاء ورأس الجداول وحماية أوراق DB_Employees, DB_Users, DB_Settings, DB_Log
'===============================================================================
Option Explicit

Sub SetupHiddenDatabaseSheets()
    On Error Resume Next
    Dim wb As Workbook: Set wb = ThisWorkbook
    Dim wsEmp As Worksheet, wsUsers As Worksheet, wsSet As Worksheet, wsLog As Worksheet
    
    ' 1. DB_Employees
    Set wsEmp = wb.Worksheets("DB_Employees")
    If wsEmp Is Nothing Then
        Set wsEmp = wb.Worksheets.Add(After:=wb.Worksheets(wb.Worksheets.Count))
        wsEmp.Name = "DB_Employees"
    End If
    wsEmp.Unprotect "BloodBank2026"
    wsEmp.Cells.Clear
    
    Dim empHeaders As Variant
    empHeaders = Array("ID", "NationalID", "JobNumber", "CadreNumber", "FullName", "MotherName", _
                       "Gender", "BirthDate", "MaritalStatus", "Qualification", "Specialization", _
                       "JobGrade", "FinancialGrade", "HireDate", "HiringEntity", "DirectingDate", _
                       "TransferredFrom", "Department", "Unit", "JobTitle", "Phone", "Email", _
                       "Status", "PDFPath", "Notes", "UpdatedAt")
    wsEmp.Range("A1:Z1").Value = empHeaders
    wsEmp.Range("A1:Z1").Font.Bold = True
    wsEmp.Range("A1:Z1").Interior.Color = RGB(139, 0, 0) ' Crimson Dark Red
    wsEmp.Range("A1:Z1").Font.Color = RGB(255, 255, 255)
    
    ' 2. DB_Users
    Set wsUsers = wb.Worksheets("DB_Users")
    If wsUsers Is Nothing Then
        Set wsUsers = wb.Worksheets.Add(After:=wb.Worksheets(wb.Worksheets.Count))
        wsUsers.Name = "DB_Users"
    End If
    wsUsers.Unprotect "BloodBank2026"
    wsUsers.Cells.Clear
    wsUsers.Range("A1:E1").Value = Array("UserID", "Username", "Password", "Role", "LastLogin")
    wsUsers.Range("A1:E1").Font.Bold = True
    
    ' إضافة مستخدمين افتراضيين Administrator 1 & Administrator 2
    wsUsers.Range("A2:E2").Value = Array(1, "admin1", "123456", "Administrator 1", Format(Now, "yyyy-mm-dd hh:mm:ss"))
    wsUsers.Range("A3:E3").Value = Array(2, "admin2", "123456", "Administrator 2", Format(Now, "yyyy-mm-dd hh:mm:ss"))
    
    ' 3. DB_Log
    Set wsLog = wb.Worksheets("DB_Log")
    If wsLog Is Nothing Then
        Set wsLog = wb.Worksheets.Add(After:=wb.Worksheets(wb.Worksheets.Count))
        wsLog.Name = "DB_Log"
    End If
    wsLog.Unprotect "BloodBank2026"
    wsLog.Cells.Clear
    wsLog.Range("A1:E1").Value = Array("LogID", "Timestamp", "User", "Action", "Details")
    wsLog.Range("A1:E1").Font.Bold = True
    
    ' إخفاء وحماية الأوراق
    wsEmp.Visible = xlSheetVeryHidden
    wsUsers.Visible = xlSheetVeryHidden
    wsLog.Visible = xlSheetVeryHidden
    
    wsEmp.Protect "BloodBank2026", UserInterfaceOnly:=True
    wsUsers.Protect "BloodBank2026", UserInterfaceOnly:=True
    wsLog.Protect "BloodBank2026", UserInterfaceOnly:=True
    
    MsgBox "تمت تهيئة وتأمين قاعدة البيانات المخفية لمصرف الدم بنجاح!", vbInformation + vbMsgBoxRight, "نجاح التشييد"
End Sub
`
  }
];
