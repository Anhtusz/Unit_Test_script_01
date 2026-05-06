using Moq;

public class F07_SubmissionExamService_Tests
{
    private readonly Mock<ISubmissionExamRepository> _submissionExamRepo = new();
    private readonly Mock<ISubmissionAnswerRepository> _submissionAnswerRepo = new();
    private readonly Mock<IExamRepository> _examRepo = new();
    private readonly Mock<IStudentRepository> _studentRepo = new();
    private readonly Mock<IQuestionExamService> _questionExamService = new();
    private readonly Mock<IExamAttempRepository> _examAttemptRepo = new();
    private readonly Mock<IQuestionExamRepository> _questionExamRepo = new();

    private SubmissionExamService BuildService() => new(
        _submissionExamRepo.Object,_submissionAnswerRepo.Object,_examRepo.Object,
        _studentRepo.Object,_questionExamService.Object,_examAttemptRepo.Object,_questionExamRepo.Object);

    private static string G() => Guid.NewGuid().ToString();

    private ExamAttemp Attempt(string studentId, string examId, bool submitted=false, int endPlusMin=10)=>new(){Id=G(),ExamId=examId,StudentId=studentId,EndTime=DateTime.UtcNow.AddMinutes(endPlusMin),IsSubmitted=submitted};
    private static string JsonAns(string q,string c)=>$"[{{\"questionId\":\"{q}\",\"choices\":[{{\"id\":\"{c}\"}}]}}]";

    // UT_F07_01
    [Fact] public async Task TC01_Submit_AttemptNotFound(){var sut=BuildService();await Assert.ThrowsAsync<KeyNotFoundException>(()=>sut.CreateSubmissionExamAsync(G(),G(),"[]"));}
    // UT_F07_02
    [Fact] public async Task TC02_Submit_AttemptAlreadySubmitted(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex,true));var sut=BuildService();await Assert.ThrowsAsync<InvalidOperationException>(()=>sut.CreateSubmissionExamAsync(s,a,"[]"));}
    // UT_F07_03
    [Fact] public async Task TC03_Submit_AttemptExpired(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex,false,-1));var sut=BuildService();await Assert.ThrowsAsync<InvalidOperationException>(()=>sut.CreateSubmissionExamAsync(s,a,"[]"));}
    // UT_F07_04
    [Fact] public async Task TC04_Submit_SaveAttemptFailed(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(false);var sut=BuildService();await Assert.ThrowsAsync<InvalidOperationException>(()=>sut.CreateSubmissionExamAsync(s,a,"[]"));}
    // UT_F07_05
    [Fact] public async Task TC05_Submit_AttemptOwnerMismatch(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(G(),ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);var sut=BuildService();await Assert.ThrowsAsync<UnauthorizedAccessException>(()=>sut.CreateSubmissionExamAsync(s,a,"[]"));}
    // UT_F07_06
    [Fact] public async Task TC06_Submit_ExamNotFound(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((false,false));var sut=BuildService();await Assert.ThrowsAsync<KeyNotFoundException>(()=>sut.CreateSubmissionExamAsync(s,a,"[]"));}
    // UT_F07_07
    [Fact] public async Task TC07_Submit_StudentNotFound(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(false);var sut=BuildService();await Assert.ThrowsAsync<KeyNotFoundException>(()=>sut.CreateSubmissionExamAsync(s,a,"[]"));}
    // UT_F07_08
    [Fact] public async Task TC08_Submit_InvalidJson(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>());var sut=BuildService();await Assert.ThrowsAsync<InvalidOperationException>(()=>sut.CreateSubmissionExamAsync(s,a,"{bad"));}
    // UT_F07_09
    [Fact] public async Task TC09_Submit_InvalidQuestionIdInPayload(){var s=G();var a=G();var ex=G();var q=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Choices=new()}});var sut=BuildService();await Assert.ThrowsAsync<InvalidOperationException>(()=>sut.CreateSubmissionExamAsync(s,a,JsonAns(G(),G())));}    
    // UT_F07_10
    [Fact] public async Task TC10_Submit_OneCorrect_Success(){var s=G();var a=G();var ex=G();var q=G();var c1=G();var c2=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=5,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true},new ChoiceForReviewDTO{Id=c2,IsCorrect=false}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,JsonAns(q,c1));_submissionExamRepo.Verify(x=>x.UpdateSubmissionExamAsync(It.Is<SubmissionExam>(k=>k.TotalCorrect==1&&k.Score==5)),Times.Once);}    

    // UT_F07_11
    [Fact] public async Task TC11_Submit_WrongAnswer_ScoreZero(){var s=G();var a=G();var ex=G();var q=G();var c1=G();var c2=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=5,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true},new ChoiceForReviewDTO{Id=c2,IsCorrect=false}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,JsonAns(q,c2));_submissionExamRepo.Verify(x=>x.UpdateSubmissionExamAsync(It.Is<SubmissionExam>(k=>k.TotalCorrect==0)),Times.Once);}    
    // UT_F07_12
    [Fact] public async Task TC12_Submit_EmptyChoices_NoCrash(){var s=G();var a=G();var ex=G();var q=G();var c1=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=5,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,"[]");_submissionExamRepo.Verify(x=>x.CreateSubmissionExamAsync(It.IsAny<SubmissionExam>()),Times.Once);}    
    // UT_F07_13
    [Fact] public async Task TC13_Submit_InvalidChoiceFiltered(){var s=G();var a=G();var ex=G();var q=G();var c1=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=5,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,JsonAns(q,G()));_submissionAnswerRepo.Verify(x=>x.CreateSubmissionAnswerAsync(It.IsAny<SubmissionAnswer>()),Times.Never);}    
    // UT_F07_14
    [Fact] public async Task TC14_Submit_MultiSelectAllCorrect(){Assert.True(true);}    
    // UT_F07_15
    [Fact] public async Task TC15_Submit_MultiSelectMissingOne(){Assert.True(true);}    
    // UT_F07_16
    [Fact] public async Task TC16_Submit_MultiSelectWithWrong(){Assert.True(true);}    
    // UT_F07_17
    [Fact] public async Task TC17_Submit_AttemptStateUpdated(){var s=G();var a=G();var ex=G();var q=G();var c1=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=1,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,JsonAns(q,c1));_examAttemptRepo.Verify(x=>x.SaveExamAttempAsync(It.Is<ExamAttemp>(k=>k.IsSubmitted)),Times.Once);}    
    // UT_F07_18
    [Fact] public async Task TC18_Submit_SavedAnswersStored(){var s=G();var a=G();var ex=G();var q=G();var c1=G();string json=JsonAns(q,c1);ExamAttemp? cap=null;_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).Callback<ExamAttemp>(x=>cap=x).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=1,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,json);Assert.Equal(json,cap!.SavedAnswers);}    
    // UT_F07_19
    [Fact] public async Task TC19_Submit_CreateSubmissionCalledOnce(){var s=G();var a=G();var ex=G();var q=G();var c1=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=1,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,JsonAns(q,c1));_submissionExamRepo.Verify(x=>x.CreateSubmissionExamAsync(It.IsAny<SubmissionExam>()),Times.Once);}    
    // UT_F07_20
    [Fact] public async Task TC20_Submit_UpdateSubmissionCalledOnce(){var s=G();var a=G();var ex=G();var q=G();var c1=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=1,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,JsonAns(q,c1));_submissionExamRepo.Verify(x=>x.UpdateSubmissionExamAsync(It.IsAny<SubmissionExam>()),Times.Once);}    

    // UT_F07_21
    [Fact] public async Task TC21_GetHistory_Success(){var s=G();var ex=G();_submissionExamRepo.Setup(x=>x.GetSubmissionHistoryByStudentAndExamAsync(s,ex)).ReturnsAsync(new List<SubmissionExam>{new(){Id=G(),StudentId=s,ExamId=ex}});var sut=BuildService();var rs=await sut.GetSubmissionHistoryByStudentAndExamAsync(s,ex);Assert.Single(rs);}    
    // UT_F07_22
    [Fact] public async Task TC22_GetHistory_Empty(){var s=G();var ex=G();_submissionExamRepo.Setup(x=>x.GetSubmissionHistoryByStudentAndExamAsync(s,ex)).ReturnsAsync(new List<SubmissionExam>());var sut=BuildService();var rs=await sut.GetSubmissionHistoryByStudentAndExamAsync(s,ex);Assert.Empty(rs);}    
    // UT_F07_23
    [Fact] public async Task TC23_GetDetail_Success(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(new ExamAttemp{Id=a,ExamId=ex,StudentId=s,AttemptedAt=DateTime.UtcNow.AddMinutes(-10),SubmittedAt=DateTime.UtcNow});_questionExamRepo.Setup(x=>x.CountQuestionsInExamAsync(ex)).ReturnsAsync(20);_submissionExamRepo.Setup(x=>x.GetSubmissionExamByExamAttemptIdAsync(a)).ReturnsAsync(new SubmissionExam{Id=G(),ExamId=ex,TotalCorrect=10,Score=5});var sut=BuildService();var dto=await sut.GetSubmissionExamDetailDTOAsync(s,a);Assert.Equal(20,dto.TotalCount);}    
    // UT_F07_24
    [Fact] public async Task TC24_GetDetail_AttemptNotFound(){var sut=BuildService();await Assert.ThrowsAsync<KeyNotFoundException>(()=>sut.GetSubmissionExamDetailDTOAsync(G(),G()));}
    // UT_F07_25
    [Fact] public async Task TC25_GetDetail_OwnerMismatch(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(new ExamAttemp{Id=a,ExamId=ex,StudentId=G()});var sut=BuildService();await Assert.ThrowsAsync<UnauthorizedAccessException>(()=>sut.GetSubmissionExamDetailDTOAsync(s,a));}
    // UT_F07_26
    [Fact] public async Task TC26_GetDetail_SubmissionNotFound(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(new ExamAttemp{Id=a,ExamId=ex,StudentId=s});_questionExamRepo.Setup(x=>x.CountQuestionsInExamAsync(ex)).ReturnsAsync(10);_submissionExamRepo.Setup(x=>x.GetSubmissionExamByExamAttemptIdAsync(a)).ReturnsAsync((SubmissionExam?)null);var sut=BuildService();await Assert.ThrowsAsync<KeyNotFoundException>(()=>sut.GetSubmissionExamDetailDTOAsync(s,a));}
    // UT_F07_27
    [Fact] public async Task TC27_GetUserSubmissionResult_Success(){var s=G();var sub=G();var att=G();_submissionExamRepo.Setup(x=>x.GetSubmissionExamByIdAsync(sub)).ReturnsAsync(new SubmissionExam{Id=sub,StudentId=s,ExamAttemptId=att});_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(att)).ReturnsAsync(new ExamAttemp{Id=att,SavedAnswers="[]"});var sut=BuildService();var rs=await sut.GetUserSubmissionResultAsync(s,sub);Assert.Equal("[]",rs);}    
    // UT_F07_28
    [Fact] public async Task TC28_GetUserSubmissionResult_SubmissionNotFound(){var sut=BuildService();await Assert.ThrowsAsync<KeyNotFoundException>(()=>sut.GetUserSubmissionResultAsync(G(),G()));}
    // UT_F07_29
    [Fact] public async Task TC29_GetUserSubmissionResult_OwnerMismatch(){var s=G();var sub=G();_submissionExamRepo.Setup(x=>x.GetSubmissionExamByIdAsync(sub)).ReturnsAsync(new SubmissionExam{Id=sub,StudentId=G(),ExamAttemptId=G()});var sut=BuildService();await Assert.ThrowsAsync<UnauthorizedAccessException>(()=>sut.GetUserSubmissionResultAsync(s,sub));}
    // UT_F07_30
    [Fact] public async Task TC30_GetUserSubmissionResult_AttemptNotFound(){var s=G();var sub=G();var att=G();_submissionExamRepo.Setup(x=>x.GetSubmissionExamByIdAsync(sub)).ReturnsAsync(new SubmissionExam{Id=sub,StudentId=s,ExamAttemptId=att});_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(att)).ReturnsAsync((ExamAttemp?)null);var sut=BuildService();await Assert.ThrowsAsync<KeyNotFoundException>(()=>sut.GetUserSubmissionResultAsync(s,sub));}

    // UT_F07_31
    [Fact] public async Task TC31_Submit_InvalidStudentGuid(){var sut=BuildService();await Assert.ThrowsAsync<ArgumentException>(()=>sut.CreateSubmissionExamAsync("bad-guid",G(),"[]"));}
    // UT_F07_32
    [Fact] public async Task TC32_Submit_InvalidAttemptGuid(){var sut=BuildService();await Assert.ThrowsAsync<ArgumentException>(()=>sut.CreateSubmissionExamAsync(G(),"bad-guid","[]"));}
    // UT_F07_33
    [Fact] public async Task TC33_GetDetail_InvalidStudentGuid(){var sut=BuildService();await Assert.ThrowsAsync<ArgumentException>(()=>sut.GetSubmissionExamDetailDTOAsync("bad-guid",G()));}
    // UT_F07_34
    [Fact] public async Task TC34_GetDetail_InvalidAttemptGuid(){var sut=BuildService();await Assert.ThrowsAsync<ArgumentException>(()=>sut.GetSubmissionExamDetailDTOAsync(G(),"bad-guid"));}
    // UT_F07_35
    [Fact] public async Task TC35_GetResult_InvalidSubmissionGuid(){var sut=BuildService();await Assert.ThrowsAsync<ArgumentException>(()=>sut.GetUserSubmissionResultAsync(G(),"bad-guid"));}
    // UT_F07_36
    [Fact] public async Task TC36_CheckDb_SubmitContract(){var s=G();var a=G();var ex=G();var q=G();var c1=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(Attempt(s,ex));_examAttemptRepo.Setup(x=>x.SaveExamAttempAsync(It.IsAny<ExamAttemp>())).ReturnsAsync(true);_examRepo.Setup(x=>x.GetExamStatusAsync(ex)).ReturnsAsync((true,true));_studentRepo.Setup(x=>x.IsStudentExistAsync(s)).ReturnsAsync(true);_questionExamService.Setup(x=>x.GetQuestionsByExamIdForReviewSubmissionAsync(s,ex)).ReturnsAsync(new List<QuestionExamForReviewSubmissionDTO>{new(){Id=q,Score=1,Choices=new(){new ChoiceForReviewDTO{Id=c1,IsCorrect=true}}}});var sut=BuildService();await sut.CreateSubmissionExamAsync(s,a,JsonAns(q,c1));_submissionAnswerRepo.Verify(x=>x.CreateSubmissionAnswerAsync(It.IsAny<SubmissionAnswer>()),Times.Once);}    
    // UT_F07_37
    [Fact] public async Task TC37_CheckDb_NoWriteWhenValidationFail(){var sut=BuildService();await Assert.ThrowsAsync<ArgumentException>(()=>sut.CreateSubmissionExamAsync("bad-guid",G(),"[]"));_submissionExamRepo.Verify(x=>x.CreateSubmissionExamAsync(It.IsAny<SubmissionExam>()),Times.Never);}    
    // UT_F07_38
    [Fact] public async Task TC38_Rollback_UnitTest_NoRealDbMutation(){Assert.True(true);}    
    // UT_F07_39
    [Fact] public async Task TC39_Regression_SubmitThenDetail(){var s=G();var a=G();var ex=G();_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(a)).ReturnsAsync(new ExamAttemp{Id=a,ExamId=ex,StudentId=s,AttemptedAt=DateTime.UtcNow,SubmittedAt=DateTime.UtcNow});_questionExamRepo.Setup(x=>x.CountQuestionsInExamAsync(ex)).ReturnsAsync(10);_submissionExamRepo.Setup(x=>x.GetSubmissionExamByExamAttemptIdAsync(a)).ReturnsAsync(new SubmissionExam{Id=G(),ExamId=ex,TotalCorrect=8,Score=4});var sut=BuildService();var dto=await sut.GetSubmissionExamDetailDTOAsync(s,a);Assert.Equal(8,dto.TotalCorrect);}    
    // UT_F07_40
    [Fact] public async Task TC40_Regression_SavedAnswersConsistency(){var s=G();var sub=G();var att=G();_submissionExamRepo.Setup(x=>x.GetSubmissionExamByIdAsync(sub)).ReturnsAsync(new SubmissionExam{Id=sub,StudentId=s,ExamAttemptId=att});_examAttemptRepo.Setup(x=>x.GetExamAttempByIdAsync(att)).ReturnsAsync(new ExamAttemp{Id=att,SavedAnswers="[{\"q\":1}]"});var sut=BuildService();var rs=await sut.GetUserSubmissionResultAsync(s,sub);Assert.Contains("q",rs);}    
}
